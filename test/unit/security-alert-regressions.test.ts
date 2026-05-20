import { describe, expect, it } from 'vitest';

import { parseEventRows } from '../../scripts/daejeon-event-sync/normalize';
import { decodeHtml, parseSamplePlaceRows } from '../../scripts/sample-place/parse';

describe('security alert regressions', () => {
  it('does not double-unescape encoded sample place cell content into markup', () => {
    expect(decodeHtml('&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(decodeHtml('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');

    const rows = parseSamplePlaceRows(`
      <table>
        <tr>
          <td>1</td>
          <td>&amp;lt;script&amp;gt;Jam&amp;lt;/script&amp;gt;</td>
          <td>cafe</td>
          <td>127.38</td>
          <td>36.35</td>
        </tr>
      </table>
    `);

    expect(rows[0]?.name).toBe('&lt;script&gt;Jam&lt;/script&gt;');
    expect(rows[0]?.name).not.toContain('<script');
  });

  it('does not double-unescape encoded public event cell content into markup', () => {
    const rows = parseEventRows(`
      <table>
        <tbody>
          <tr>
            <td class="subject"><a href="/event?eventSeq=123">&amp;lt;script&amp;gt;Jam&amp;lt;/script&amp;gt;</a></td>
            <td class="theme">주제 : &amp;lt;img src=x&amp;gt;</td>
            <td class="location">대전시청</td>
            <td class="date3">2026-05-01</td>
            <td class="date3">2026-05-02</td>
          </tr>
        </tbody>
      </table>
    `);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe('&lt;script&gt;Jam&lt;/script&gt;');
    expect(rows[0]?.summary).toContain('&lt;img src=x&gt;');
    expect(rows[0]?.summary).not.toContain('<img');
    expect(rows[0]?.venueName).not.toContain('<');
    expect(rows[0]?.rawPayload.startDate).not.toContain('<');
    expect(rows[0]?.rawPayload.endDate).not.toContain('<');
  });
});
