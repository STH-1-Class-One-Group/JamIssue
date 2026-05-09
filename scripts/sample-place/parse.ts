export interface RawSamplePlaceRow {
  number: number;
  name: string;
  rawCategory: string;
  longitude: number;
  latitude: number;
}

const SAFE_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  quot: '"',
  '#39': "'",
  nbsp: ' ',
};

function decodeSafeHtmlEntities(value: string) {
  return value.replace(/&(amp|quot|#39|nbsp);/g, (entity, key: string) => SAFE_ENTITY_MAP[key] ?? entity);
}

function stripMarkup(value: string) {
  let output = '';
  let insideTag = false;
  for (const char of value) {
    if (char === '<') {
      insideTag = true;
      continue;
    }
    if (char === '>') {
      insideTag = false;
      continue;
    }
    if (!insideTag) {
      output += char;
    }
  }
  return output;
}

export function decodeHtml(value: string) {
  return decodeSafeHtmlEntities(stripMarkup(value)).trim();
}

export function parseSamplePlaceRows(html: string): RawSamplePlaceRow[] {
  const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const rows: RawSamplePlaceRow[] = [];

  for (const match of rowMatches) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => decodeHtml(cell[1]));
    if (cells.length !== 5 || cells[0] === '번호') continue;

    const number = Number(cells[0]);
    if (!Number.isFinite(number)) continue;

    rows.push({
      number,
      name: cells[1],
      rawCategory: cells[2],
      longitude: Number(cells[3]),
      latitude: Number(cells[4]),
    });
  }

  return rows;
}
