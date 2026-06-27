/**

 * data/shareholder-meetings.csv → shareholderMeetingSchedule.generated.ts

 *

 * 用法: npm run import:shareholder-meetings

 */



import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSV_PATH = path.join(__dirname, '../data/shareholder-meetings.csv');

const OUT_PATH = path.join(__dirname, '../src/data/shareholderMeetingSchedule.generated.ts');

const JSON_PATH = path.join(__dirname, '../data/shareholder-meetings.json');

const META_PATH = path.join(__dirname, '../data/shareholder-meetings-fetch-meta.json');



const KNOWN_VENUES = new Set([

  '東京国際フォーラム',

  'ホテルニューオータニ',

  '東京ドーム',

  'ヒルトン東京',

  '三井ガーデンホテル渋谷',

]);



function stripBom(text) {

  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

}



function parseCsvLine(line) {

  const cells = [];

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



function escapeTs(str) {

  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

}



function slugId(companyName, meetingDate) {

  const base = `${meetingDate}_${companyName}`.replace(/\s+/g, '_').slice(0, 48);

  return `agm_${base.replace(/[^\w\u3000-\u9fff-]/g, '')}`;

}



function parseOptionalFloat(value) {

  if (!value) return undefined;

  const num = Number.parseFloat(value);

  return Number.isFinite(num) ? num : undefined;

}



function hasResolvableLocation(venueName, latitude, longitude) {

  if (latitude != null && longitude != null) return true;

  return KNOWN_VENUES.has(venueName);

}



function parseCsv(csvText) {

  const meetings = [];

  const issues = [];

  const seenIds = new Set();



  const lines = stripBom(csvText)

    .split(/\r?\n/)

    .map((l) => l.trim())

    .filter((l) => l.length > 0 && !l.startsWith('#'));



  if (lines.length === 0) {

    return { meetings, issues: ['CSV empty'] };

  }



  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

  const col = (name) => headerCells.indexOf(name);



  for (let i = 1; i < lines.length; i += 1) {

    const lineNo = i + 1;

    const cells = parseCsvLine(lines[i]);

    const get = (name) => {

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

    const venueAddress = get('venue_address');

    const ward = get('ward');

    const latitude = parseOptionalFloat(get('latitude'));

    const longitude = parseOptionalFloat(get('longitude'));



    if (!hasResolvableLocation(venueName, latitude, longitude)) {

      issues.push(`L${lineNo}: 座標未解決「${venueName}」`);

      continue;

    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate)) {

      issues.push(`L${lineNo}: 日付不正 ${meetingDate}`);

      continue;

    }

    if (!/^\d{1,2}:\d{2}$/.test(startTime)) {

      issues.push(`L${lineNo}: 時刻不正 ${startTime}`);

      continue;

    }



    const participantCount = Number.parseInt(rawCount, 10);

    if (!Number.isFinite(participantCount) || participantCount <= 0) {

      issues.push(`L${lineNo}: 人数不正 ${rawCount}`);

      continue;

    }

    if (seenIds.has(id)) {

      issues.push(`L${lineNo}: 重複 id ${id}`);

      continue;

    }

    seenIds.add(id);



    const [h, m] = startTime.split(':');

    meetings.push({

      id,

      companyName,

      venueName,

      meetingDate,

      startTime: `${h.padStart(2, '0')}:${m.padStart(2, '0')}`,

      participantCount,

      venueAddress: venueAddress || undefined,

      ward: ward || undefined,

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



function formatOptionalString(value) {

  if (!value) return 'undefined';

  return `'${escapeTs(value)}'`;

}



function formatOptionalNumber(value) {

  if (value == null) return 'undefined';

  return String(value);

}



function writeGenerated(meetings, sourcePath) {

  const rows = meetings.map((m) => {

    const parts = [

      `id: '${escapeTs(m.id)}'`,

      `companyName: '${escapeTs(m.companyName)}'`,

      `venueName: '${escapeTs(m.venueName)}'`,

      `meetingDate: '${m.meetingDate}'`,

      `startTime: '${m.startTime}'`,

      `participantCount: ${m.participantCount}`,

    ];

    if (m.venueAddress) parts.push(`venueAddress: '${escapeTs(m.venueAddress)}'`);

    if (m.ward) parts.push(`ward: '${escapeTs(m.ward)}'`);

    if (m.latitude != null) parts.push(`latitude: ${m.latitude}`);

    if (m.longitude != null) parts.push(`longitude: ${m.longitude}`);

    return `  { ${parts.join(', ')} },`;

  });



  const content = `/**

 * AUTO-GENERATED — 手編集しない

 * 生成: npm run import:shareholder-meetings

 * 入力: ${path.relative(path.join(__dirname, '..'), sourcePath).replace(/\\/g, '/')}

 * 件数: ${meetings.length}

 * 生成日: ${new Date().toISOString().slice(0, 10)}

 */



import type { ScheduledShareholderMeeting } from '@/types/shareholderMeeting';



export const SHAREHOLDER_MEETING_SCHEDULE_IMPORTED: readonly ScheduledShareholderMeeting[] = [

${rows.join('\n')}

];

`;



  fs.writeFileSync(OUT_PATH, content, 'utf8');

}



function writeJson(meetings) {

  let rangeSince;

  let rangeUntil;

  if (fs.existsSync(META_PATH)) {

    try {

      const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));

      rangeSince = meta.rangeSince;

      rangeUntil = meta.rangeUntil;

    } catch {

      // ignore

    }

  }



  const payload = {

    version: 1,

    generatedAt: new Date().toISOString(),

    rangeSince,

    rangeUntil,

    meetings,

  };



  fs.writeFileSync(JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Exported JSON → ${JSON_PATH}`);

}



function main() {

  if (!fs.existsSync(CSV_PATH)) {

    console.error(`CSV not found: ${CSV_PATH}`);

    process.exit(1);

  }



  const csv = fs.readFileSync(CSV_PATH, 'utf8');

  const { meetings, issues } = parseCsv(csv);



  if (issues.length > 0) {

    console.warn('Warnings:');

    for (const issue of issues) console.warn(`  - ${issue}`);

  }



  if (meetings.length === 0) {

    console.error('No valid meetings — aborting');

    process.exit(1);

  }



  writeGenerated(meetings, CSV_PATH);

  writeJson(meetings);

  console.log(`Imported ${meetings.length} meetings → ${OUT_PATH}`);

}



main();

