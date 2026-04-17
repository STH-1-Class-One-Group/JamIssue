import fs from 'node:fs';
import path from 'node:path';

import {
  CATEGORY_META,
  MANUAL_OVERRIDES_BY_NUMBER,
  deriveTags,
  getImageFileName,
  inferDistrict,
  makeDescription,
  makeRouteHint,
  makeSummary,
  normalizeCategory,
  slugify,
} from './sample-place/derive';
import { parseSamplePlaceRows } from './sample-place/parse';
import { buildSamplePlaceSeedSql } from './sample-place/sql';

const projectRoot = process.cwd();
const sampleDir = path.join(projectRoot, 'sample');
const htmlPath = path.join(sampleDir, '장소별 위치 3294836daaec807c9e20de8938a26e1c.html');
const outputJsonPath = path.join(sampleDir, 'places.generated.json');
const outputSqlPath = path.join(projectRoot, 'backend', 'sql', 'migrations', '20260323_seed_sample_places.sql');

const html = fs.readFileSync(htmlPath, 'utf8');
const rows = parseSamplePlaceRows(html);
const usedSlugs = new Set<string>();

const places = rows.map((row) => {
  const category = normalizeCategory(row.rawCategory);
  const override = MANUAL_OVERRIDES_BY_NUMBER[row.number] ?? null;
  const resolvedLatitude = override?.latitude ?? row.latitude;
  const resolvedLongitude = override?.longitude ?? row.longitude;
  const district = override?.district ?? inferDistrict(row.name, resolvedLatitude, resolvedLongitude);
  const slug = slugify(row.number, row.name, usedSlugs);
  const imageFileName = getImageFileName(row.number);
  const localImagePath = path.join(sampleDir, imageFileName);
  const imageExists = fs.existsSync(localImagePath);
  const imageStoragePath = `places/${String(row.number).padStart(3, '0')}/hero.png`;

  return {
    number: row.number,
    slug,
    name: row.name,
    rawCategory: row.rawCategory,
    category,
    district,
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
    summary: makeSummary(row.name, category),
    description: makeDescription(row.name, category, district),
    vibeTags: deriveTags(row.name, category, district, row.rawCategory),
    visitTime: CATEGORY_META[category].visitTime,
    routeHint: makeRouteHint(category, district),
    stampReward: CATEGORY_META[category].stampReward,
    heroLabel: CATEGORY_META[category].heroLabel,
    jamColor: CATEGORY_META[category].jamColor,
    accentColor: CATEGORY_META[category].accentColor,
    imageFileName,
    imageExists,
    imageStoragePath,
    imageUrl: null,
  };
});

if (places.length === 0) {
  throw new Error('sample HTML에서 장소 데이터를 찾지 못했습니다.');
}

const missingImages = places.filter((place) => !place.imageExists);
if (missingImages.length > 0) {
  throw new Error(`이미지 파일이 누락되었습니다: ${missingImages.map((place) => `${place.number}:${place.imageFileName}`).join(', ')}`);
}

const sql = buildSamplePlaceSeedSql(places);

fs.writeFileSync(outputJsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), count: places.length, places }, null, 2), 'utf8');
fs.writeFileSync(outputSqlPath, Buffer.from('\uFEFF' + sql, 'utf8'));

console.log(`generated ${places.length} places`);
console.log(outputJsonPath);
console.log(outputSqlPath);
