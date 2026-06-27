/**

 * CSV → ScheduledShareholderMeeting パース（import スクリプト / テスト共用）

 */



import type { ScheduledShareholderMeeting } from '@/types/shareholderMeeting';

import { resolveShareholderMeetingCoordinate } from '@/utils/shareholderMeetingLocation';



export const SHAREHOLDER_MEETING_CSV_COLUMNS = [

  'id',

  'company_name',

  'venue_name',

  'venue_address',

  'ward',

  'latitude',

  'longitude',

  'meeting_date',

  'start_time',

  'participant_count',

] as const;



export const LEGACY_SHAREHOLDER_MEETING_CSV_COLUMNS = [

  'id',

  'company_name',

  'venue_name',

  'meeting_date',

  'start_time',

  'participant_count',

] as const;



export const VALID_SHAREHOLDER_VENUE_NAMES = [

  '東京国際フォーラム',

  'ホテルニューオータニ',

  '東京ドーム',

  'ヒルトン東京',

  '三井ガーデンホテル渋谷',

] as const;



export interface CsvParseIssue {

  line: number;

  message: string;

}



export interface CsvParseResult {

  meetings: ScheduledShareholderMeeting[];

  issues: CsvParseIssue[];

}



function stripBom(text: string): string {

  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

}



function parseCsvLine(line: string): string[] {

  const cells: string[] = [];

  let current = '';

  let inQuotes = false;



  for (let i = 0; i < line.length; i += 1) {

    const ch = line[i];

    if (ch === '"') {

      if (inQuotes && line[i + 1] === '"') {

        current += '"';

        i += 1;

      } else {

        inQuotes = !inQuotes;

      }

      continue;

    }

    if (ch === ',' && !inQuotes) {

      cells.push(current.trim());

      current = '';

      continue;

    }

    current += ch;

  }

  cells.push(current.trim());

  return cells;

}



function slugId(companyName: string, meetingDate: string): string {

  const base = `${meetingDate}_${companyName}`

    .replace(/\s+/g, '_')

    .replace(/[^\w\u3000-\u9fff-]/g, '')

    .slice(0, 48);

  return `agm_${base}`;

}



function isValidDate(value: string): boolean {

  return /^\d{4}-\d{2}-\d{2}$/.test(value);

}



function isValidTime(value: string): boolean {

  return /^\d{1,2}:\d{2}$/.test(value);

}



function parseOptionalFloat(value: string | undefined): number | undefined {

  if (!value) return undefined;

  const num = Number.parseFloat(value);

  return Number.isFinite(num) ? num : undefined;

}



function isKnownVenue(venueName: string): boolean {

  return VALID_SHAREHOLDER_VENUE_NAMES.includes(

    venueName as (typeof VALID_SHAREHOLDER_VENUE_NAMES)[number]

  );

}



function hasResolvableLocation(

  venueName: string,

  latitude?: number,

  longitude?: number

): boolean {

  if (latitude != null && longitude != null) return true;

  return resolveShareholderMeetingCoordinate({ venueName, latitude, longitude }) != null;

}



export function parseShareholderMeetingsCsv(csvText: string): CsvParseResult {

  const meetings: ScheduledShareholderMeeting[] = [];

  const issues: CsvParseIssue[] = [];

  const seenIds = new Set<string>();



  const lines = stripBom(csvText)

    .split(/\r?\n/)

    .map((line) => line.trim())

    .filter((line) => line.length > 0 && !line.startsWith('#'));



  if (lines.length === 0) {

    return { meetings, issues: [{ line: 0, message: 'CSV が空です' }] };

  }



  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

  const col = (name: string): number => headerCells.indexOf(name);



  if (col('id') < 0 || col('company_name') < 0 || col('venue_name') < 0) {

    issues.push({ line: 1, message: 'ヘッダーに id, company_name, venue_name が必要です' });

    return { meetings, issues };

  }



  const isExtended = col('latitude') >= 0 && col('longitude') >= 0;



  for (let i = 1; i < lines.length; i += 1) {

    const lineNo = i + 1;

    const cells = parseCsvLine(lines[i]);



    const get = (name: string): string => {

      const idx = col(name);

      return idx >= 0 && idx < cells.length ? cells[idx] : '';

    };



    const companyName = get('company_name');

    const venueName = get('venue_name');

    const meetingDate = get('meeting_date');

    const startTime = get('start_time');

    const rawCount = get('participant_count');

    const rawId = get('id');

    const id = rawId || slugId(companyName, meetingDate);



    const venueAddress = get('venue_address') || undefined;

    const ward = get('ward') || undefined;

    const latitude = parseOptionalFloat(get('latitude'));

    const longitude = parseOptionalFloat(get('longitude'));



    if (!companyName) {

      issues.push({ line: lineNo, message: 'company_name が空です' });

      continue;

    }



    if (!venueName) {

      issues.push({ line: lineNo, message: 'venue_name が空です' });

      continue;

    }



    if (!hasResolvableLocation(venueName, latitude, longitude)) {

      issues.push({

        line: lineNo,

        message: `座標未解決: ${venueName}（latitude/longitude またはマスター5会場が必要）`,

      });

      continue;

    }



    if (!isExtended && !isKnownVenue(venueName)) {

      issues.push({

        line: lineNo,

        message: `未登録会場: ${venueName}（拡張CSVでは latitude/longitude を付与してください）`,

      });

      continue;

    }



    if (!isValidDate(meetingDate)) {

      issues.push({ line: lineNo, message: `日付形式不正: ${meetingDate}（YYYY-MM-DD）` });

      continue;

    }



    if (!isValidTime(startTime)) {

      issues.push({ line: lineNo, message: `時刻形式不正: ${startTime}（HH:MM）` });

      continue;

    }



    const participantCount = Number.parseInt(rawCount, 10);

    if (!Number.isFinite(participantCount) || participantCount <= 0) {

      issues.push({ line: lineNo, message: `participant_count 不正: ${rawCount}` });

      continue;

    }



    if (seenIds.has(id)) {

      issues.push({ line: lineNo, message: `重複 id: ${id}` });

      continue;

    }

    seenIds.add(id);



    const [hourStr, minuteStr] = startTime.split(':');

    const normalizedTime = `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`;



    meetings.push({

      id,

      companyName,

      venueName,

      meetingDate,

      startTime: normalizedTime,

      participantCount,

      venueAddress,

      ward,

      latitude,

      longitude,

    });

  }



  meetings.sort((a, b) => {

    if (a.meetingDate !== b.meetingDate) return a.meetingDate.localeCompare(b.meetingDate);

    return a.startTime.localeCompare(b.startTime);

  });



  return { meetings, issues };

}

