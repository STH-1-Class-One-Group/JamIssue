export interface RawSamplePlaceRow {
  number: number;
  name: string;
  rawCategory: string;
  longitude: number;
  latitude: number;
}

export function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
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
