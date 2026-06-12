import { describe, expect, it } from 'vitest';
import {
  normalizeCollectedEvents,
  parseEventRows,
  parseMaxPage,
} from '../../scripts/daejeon-event-sync/normalize';
import type { ImportedEvent } from '../../scripts/daejeon-event-sync/types';

function eventFixture(overrides: Partial<ImportedEvent> = {}): ImportedEvent {
  return {
    externalId: overrides.externalId ?? 'event-1',
    title: overrides.title ?? 'Event',
    venueName: overrides.venueName ?? 'Venue',
    district: 'District',
    address: null,
    roadAddress: overrides.roadAddress ?? 'Venue Road',
    startsAt: overrides.startsAt ?? '2026-05-14T00:00:00+09:00',
    endsAt: overrides.endsAt ?? '2026-05-14T23:59:59+09:00',
    homepageUrl: 'https://event.test',
    latitude: null,
    longitude: null,
    summary: overrides.summary ?? '',
    rawPayload: {
      eventSeq: overrides.rawPayload?.eventSeq ?? 'event-1',
      theme: overrides.rawPayload?.theme ?? '',
      venueName: overrides.rawPayload?.venueName ?? 'Venue',
      startDate: overrides.rawPayload?.startDate ?? '2026-05-14',
      endDate: overrides.rawPayload?.endDate ?? '2026-05-14',
      mergedEventSeqs: overrides.rawPayload?.mergedEventSeqs,
    },
    ...overrides,
  };
}

describe('daejeon event normalizer', () => {
  it('parses max page links and falls back to one page when pagination is absent', () => {
    expect(parseMaxPage('<a href="javascript:fn_link_page(2)">2</a><a href="javascript:fn_link_page(7)">7</a>')).toBe(7);
    expect(parseMaxPage('<html><body>no pagination</body></html>')).toBe(1);
  });

  it('parses valid event rows while stripping markup and safe entities', () => {
    const rows = parseEventRows(`
      <table>
        <tbody>
          <tr>
            <td class="subject"><a href="/event?eventSeq=123">Jam &amp; Bread <strong>Festival</strong></a></td>
            <td class="theme">Theme &quot;Local&quot;</td>
            <td class="location">Daejeon &nbsp; Hall</td>
            <td class="date3">2026-05-14</td>
            <td class="date3">2026-05-15</td>
          </tr>
          <tr>
            <td class="subject">Missing Sequence</td>
            <td class="date3">2026-05-14</td>
            <td class="date3">2026-05-15</td>
          </tr>
          <tr>
            <td class="subject"><a href="/event?eventSeq=456"></a></td>
            <td class="date3">2026-05-14</td>
            <td class="date3">2026-05-15</td>
          </tr>
        </tbody>
      </table>
    `);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      externalId: 'daejeon-event-123',
      title: 'Jam & Bread Festival',
      venueName: 'Daejeon Hall',
      address: 'Daejeon Hall',
      roadAddress: 'Daejeon Hall',
      startsAt: '2026-05-14T00:00:00+09:00',
      endsAt: '2026-05-15T23:59:59+09:00',
      rawPayload: {
        eventSeq: '123',
        theme: 'Theme "Local"',
        venueName: 'Daejeon Hall',
        startDate: '2026-05-14',
        endDate: '2026-05-15',
      },
    });
    expect(rows[0].homepageUrl).toContain('eventSeq=123');
    expect(rows[0].summary).toContain('Theme "Local"');
  });

  it('returns no rows for missing table bodies and skips rows without required dates', () => {
    expect(parseEventRows('<html><body>empty</body></html>')).toEqual([]);

    const rows = parseEventRows(`
      <table>
        <tbody>
          <tr>
            <td class="subject"><a href="/event?eventSeq=777">No dates</a></td>
            <td class="theme">Theme</td>
            <td class="location">Venue</td>
            <td class="date3"></td>
            <td class="date3">2026-05-15</td>
          </tr>
          <tr>
            <td class="subject"><a href="/event?eventSeq=778">No end date</a></td>
            <td class="theme"></td>
            <td class="location"></td>
            <td class="date3">2026-05-15</td>
          </tr>
        </tbody>
      </table>
    `);

    expect(rows).toEqual([]);
  });

  it('parses rows with missing optional cells and falls back to official schedule summary', () => {
    const rows = parseEventRows(`
      <table>
        <tbody>
          <tr>
            <td class="subject"><a href="/event?eventSeq=999">No Optional Cells</a></td>
            <td class="date3">2026-06-01</td>
            <td class="date3">2026-06-02</td>
          </tr>
        </tbody>
      </table>
    `);

    expect(rows).toEqual([
      expect.objectContaining({
        externalId: 'daejeon-event-999',
        title: 'No Optional Cells',
        venueName: null,
        address: null,
        roadAddress: null,
        summary: expect.any(String),
        rawPayload: expect.objectContaining({
          theme: '',
          venueName: '',
          startDate: '2026-06-01',
          endDate: '2026-06-02',
        }),
      }),
    ]);
  });

  it('merges adjacent event series and keeps non-adjacent periods separate', () => {
    const merged = normalizeCollectedEvents([
      eventFixture({
        externalId: 'raw-1',
        title: 'Series [1회]',
        startsAt: '2026-05-14T00:00:00+09:00',
        endsAt: '2026-05-14T23:59:59+09:00',
        rawPayload: { eventSeq: 'raw-1', theme: '', venueName: 'Venue', startDate: '2026-05-14', endDate: '2026-05-14' },
      }),
      eventFixture({
        externalId: 'raw-2',
        title: 'Series [2회]',
        startsAt: '2026-05-15T00:00:00+09:00',
        endsAt: '2026-05-16T23:59:59+09:00',
        summary: 'second summary',
        rawPayload: { eventSeq: 'raw-2', theme: 'theme-2', venueName: '', startDate: '2026-05-15', endDate: '2026-05-16' },
      }),
      eventFixture({
        externalId: 'raw-3',
        title: 'Series [3회]',
        startsAt: '2026-05-20T00:00:00+09:00',
        endsAt: '2026-05-20T23:59:59+09:00',
        rawPayload: { eventSeq: 'raw-3', theme: '', venueName: 'Venue', startDate: '2026-05-20', endDate: '2026-05-20' },
      }),
    ]);

    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      title: 'Series [1회]',
      startsAt: '2026-05-14T00:00:00+09:00',
      endsAt: '2026-05-16T23:59:59+09:00',
      summary: 'second summary',
    });
    expect(merged[0].externalId).toMatch(/^festival-/);
    expect(merged[0].rawPayload).toMatchObject({
      eventSeq: 'raw-1',
      theme: 'theme-2',
      venueName: 'Venue',
      mergedEventSeqs: ['raw-1', 'raw-2'],
    });
    expect(merged[1].rawPayload.mergedEventSeqs).toEqual(['raw-3']);
  });

  it('keeps invalid or non-overlapping series separate and sorts same-day rows by title', () => {
    const normalized = normalizeCollectedEvents([
      eventFixture({
        externalId: 'invalid-date',
        title: 'Broken Series',
        startsAt: 'not-a-date',
        endsAt: '2026-05-14T23:59:59+09:00',
        rawPayload: { eventSeq: '', theme: '', venueName: '', startDate: '', endDate: '' },
      }),
      eventFixture({
        externalId: 'beta',
        title: 'Beta Series',
        startsAt: '2026-05-14T00:00:00+09:00',
        endsAt: '2026-05-14T23:59:59+09:00',
        venueName: null,
        roadAddress: 'Road',
        rawPayload: { eventSeq: 'beta', theme: '', venueName: '', startDate: '2026-05-14', endDate: '2026-05-14' },
      }),
      eventFixture({
        externalId: 'alpha',
        title: 'Alpha Series',
        startsAt: '2026-05-14T00:00:00+09:00',
        endsAt: '2026-05-14T23:59:59+09:00',
        venueName: null,
        roadAddress: 'Road',
        rawPayload: { eventSeq: 'alpha', theme: '', venueName: '', startDate: '2026-05-14', endDate: '2026-05-14' },
      }),
    ]);

    expect(normalized.map((event) => event.title)).toEqual(['Broken Series', 'Alpha Series', 'Beta Series']);
    expect(normalized).toHaveLength(3);
    expect(normalized[0].rawPayload.mergedEventSeqs).toEqual([]);
  });

  it('deduplicates generated series ids and extends existing grouped event windows', () => {
    const first = eventFixture({
      externalId: 'legacy-id',
      title: 'Same Series',
      startsAt: '2026-05-15T00:00:00+09:00',
      endsAt: '2026-05-15T23:59:59+09:00',
      summary: '',
      rawPayload: { eventSeq: 'seq-1', theme: '', venueName: 'Venue', startDate: '2026-05-15', endDate: '2026-05-15' },
    });
    const second = eventFixture({
      externalId: 'legacy-id',
      title: 'Same Series',
      startsAt: '2026-05-14T00:00:00+09:00',
      endsAt: '2026-05-16T23:59:59+09:00',
      summary: 'filled summary',
      rawPayload: {
        eventSeq: 'seq-2',
        theme: 'theme',
        venueName: '',
        startDate: '2026-05-14',
        endDate: '2026-05-16',
        mergedEventSeqs: ['seq-2'],
      },
    });

    const [deduped] = normalizeCollectedEvents([first, second]);

    expect(deduped).toMatchObject({
      startsAt: '2026-05-14T00:00:00+09:00',
      endsAt: '2026-05-16T23:59:59+09:00',
      summary: 'filled summary',
    });
    expect(deduped.rawPayload).toMatchObject({
      eventSeq: 'seq-2',
      theme: 'theme',
      venueName: 'Venue',
      mergedEventSeqs: ['seq-2', 'seq-1'],
    });
  });

  it('decodes only safe HTML entities and ignores unknown entity text while stripping tags', () => {
    const [row] = parseEventRows(`
      <table>
        <tbody>
          <tr>
            <td class="subject"><a href="/event?eventSeq=321">Safe &amp; &unknown; Title <span>Here</span></a></td>
            <td class="theme">주제 : Theme&nbsp;Name</td>
            <td class="location">Venue&#39;s Hall</td>
            <td class="date3">2026-07-01</td>
            <td class="date3">2026-07-02</td>
          </tr>
        </tbody>
      </table>
    `);

    expect(row).toMatchObject({
      title: 'Safe & &unknown; Title Here',
      venueName: "Venue's Hall",
      summary: "Theme Name · Venue's Hall",
      rawPayload: expect.objectContaining({
        theme: 'Theme Name',
        venueName: "Venue's Hall",
      }),
    });
  });

  it('keeps overlapping periods mergeable and preserves existing summary/theme fallbacks', () => {
    const [merged] = normalizeCollectedEvents([
      eventFixture({
        externalId: 'overlap-1',
        title: 'Overlap Series',
        startsAt: '2026-08-01T00:00:00+09:00',
        endsAt: '2026-08-05T23:59:59+09:00',
        summary: 'first summary',
        rawPayload: { eventSeq: 'overlap-1', theme: 'first theme', venueName: '', startDate: '2026-08-01', endDate: '2026-08-05' },
      }),
      eventFixture({
        externalId: 'overlap-2',
        title: 'Overlap Series',
        startsAt: '2026-08-03T00:00:00+09:00',
        endsAt: '2026-08-07T23:59:59+09:00',
        summary: 'second summary',
        rawPayload: { eventSeq: 'overlap-2', theme: 'second theme', venueName: 'Venue 2', startDate: '2026-08-03', endDate: '2026-08-07' },
      }),
    ]);

    expect(merged).toMatchObject({
      startsAt: '2026-08-01T00:00:00+09:00',
      endsAt: '2026-08-07T23:59:59+09:00',
      summary: 'first summary',
    });
    expect(merged.rawPayload).toMatchObject({
      theme: 'first theme',
      venueName: 'Venue 2',
      mergedEventSeqs: ['overlap-1', 'overlap-2'],
    });
  });

  it('does not merge invalid adjacent date keys and keeps fallback external ids deterministic', () => {
    const normalized = normalizeCollectedEvents([
      eventFixture({
        externalId: '',
        title: 'Invalid Adjacent',
        startsAt: '2026-09-01T00:00:00+09:00',
        endsAt: 'invalid-date',
        rawPayload: { eventSeq: '', theme: '', venueName: '', startDate: '', endDate: '' },
      }),
      eventFixture({
        externalId: '',
        title: 'Invalid Adjacent',
        startsAt: '2026-09-02T00:00:00+09:00',
        endsAt: '2026-09-03T23:59:59+09:00',
        rawPayload: { eventSeq: '', theme: '', venueName: '', startDate: '', endDate: '' },
      }),
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized.every((event) => event.externalId.startsWith('festival-'))).toBe(true);
    expect(normalized.every((event) => event.rawPayload.mergedEventSeqs?.length === 0)).toBe(true);
  });
});
