import ExcelJS from 'exceljs';
import { getKpiDB, getDbType, initDB } from '../db.js';

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function getGermanHolidays(year) {
  const holidays = new Set();
  
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  holidays.add(`${year}-01-01`);
  
  const easter = getEasterSunday(year);
  
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.add(formatDate(goodFriday));
  
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  holidays.add(formatDate(easterMonday));
  
  holidays.add(`${year}-05-01`);
  
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  holidays.add(formatDate(ascension));
  
  const whitMonday = new Date(easter);
  whitMonday.setDate(easter.getDate() + 50);
  holidays.add(formatDate(whitMonday));
  
  holidays.add(`${year}-10-03`);
  
  holidays.add(`${year}-12-25`);
  holidays.add(`${year}-12-26`);
  
  return holidays;
}

function getWorkingDaysInYear(year) {
  const startDate = new Date(year, 0, 1);
  const today = new Date();
  const endOfYear = new Date(year, 11, 31);
  const endDate = new Date(Math.min(today.getTime(), endOfYear.getTime()));
  
  const holidays = getGermanHolidays(year);
  
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = formatDate(current);
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateStr)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

function getWorkingDaysInMonth(year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const today = new Date();
  
  if (endDate > today) {
    endDate.setTime(today.getTime());
  }
  
  const holidays = getGermanHolidays(year);
  
  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  let workingDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = formatDate(current);
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateStr)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

const monthNames = {
  '01': 'Januar',
  '02': 'Februar',
  '03': 'März',
  '04': 'April',
  '05': 'Mai',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'August',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Dezember'
};

function getWorkingHoursForTimeRange(startHour, startMinute, endHour, endMinute) {
  const WORK_START = 8;
  const WORK_END = 17;
  const LUNCH_START = 12;
  const LUNCH_END = 13;
  
  const startTime = startHour + startMinute / 60;
  const endTime = endHour + endMinute / 60;
  
  if (startTime >= WORK_END || endTime <= WORK_START) {
    return 0;
  }
  
  const effectiveStart = Math.max(startTime, WORK_START);
  const effectiveEnd = Math.min(endTime, WORK_END);
  
  if (effectiveStart >= effectiveEnd) {
    return 0;
  }
  
  let hours = 0;
  
  const morningStart = effectiveStart;
  const morningEnd = Math.min(effectiveEnd, LUNCH_START);
  if (morningEnd > morningStart) {
    hours += morningEnd - morningStart;
  }
  
  const afternoonStart = Math.max(effectiveStart, LUNCH_END);
  const afternoonEnd = effectiveEnd;
  if (afternoonEnd > afternoonStart) {
    hours += afternoonEnd - afternoonStart;
  }
  
  return hours;
}

function calculateWorkingHours(startDate, endDate) {
  if (!startDate || !endDate) return null;
  
  let start, end;
  
  if (typeof startDate === 'string') {
    start = new Date(startDate);
  } else if (startDate instanceof Date) {
    start = new Date(startDate);
  } else {
    return null;
  }
  
  if (typeof endDate === 'string') {
    end = new Date(endDate);
  } else if (endDate instanceof Date) {
    end = new Date(endDate);
  } else {
    return null;
  }
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  
  if (start > end) return null;
  
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  
  const holidaysByYear = new Map();
  for (let year = startYear; year <= endYear; year++) {
    holidaysByYear.set(year, getGermanHolidays(year));
  }
  
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  const sameDay = startDateOnly.getTime() === endDateOnly.getTime();
  
  if (sameDay) {
    const dayOfWeek = start.getDay();
    const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const holidays = holidaysByYear.get(start.getFullYear());
    
    if (dayOfWeek === 0 || dayOfWeek === 6 || holidays.has(dateStr)) {
      return 0;
    }
    
    const hours = getWorkingHoursForTimeRange(
      start.getHours(),
      start.getMinutes(),
      end.getHours(),
      end.getMinutes()
    );
    
    return Math.round(hours * 10) / 10;
  }
  
  let totalHours = 0;
  const current = new Date(startDateOnly);
  
  while (current <= endDateOnly) {
    const dayOfWeek = current.getDay();
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    const year = current.getFullYear();
    const holidays = holidaysByYear.get(year);
    
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.has(dateStr);
    
    if (!isWeekend && !isHoliday) {
      const isStartDay = current.getTime() === startDateOnly.getTime();
      const isEndDay = current.getTime() === endDateOnly.getTime();
      
      if (isStartDay) {
        const hours = getWorkingHoursForTimeRange(
          start.getHours(),
          start.getMinutes(),
          17, 0
        );
        totalHours += hours;
      } else if (isEndDay) {
        const hours = getWorkingHoursForTimeRange(
          8, 0,
          end.getHours(),
          end.getMinutes()
        );
        totalHours += hours;
      } else {
        totalHours += 8;
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return Math.round(totalHours * 10) / 10;
}

export async function getNewTicketsByCategory(year = '26') {
  const db = getKpiDB();
  const isOracle = getDbType() === 'oracle';
  
  const yearFilter = year.length === 4 ? year.slice(2) : year;
  
  const yearWhere = isOracle 
    ? `TO_CHAR(t.CDB_CDATE, 'YY') = '${yearFilter}'`
    : `substr(t.CDB_CDATE, 7, 2) = '${yearFilter}'`;

  const query = `
    SELECT 
      ty.type_name_de as kategorie,
      COUNT(*) as anzahl
    FROM cs_ticket_ticket t
    LEFT JOIN cs_ticket_type ty ON t.type_id = ty.type_id
    WHERE ${yearWhere}
    GROUP BY ty.type_name_de
    ORDER BY anzahl DESC
  `;

  const results = await db.queryAll(query);
  
  return results.map(row => ({
    kategorie: isOracle ? row.KATEGORIE || 'Keine Kategorie' : row.kategorie || 'Keine Kategorie',
    anzahl: isOracle ? row.ANZAHL : row.anzahl
  }));
}

export async function getNewTicketsByMonth(year = '26') {
  const db = getKpiDB();
  const isOracle = getDbType() === 'oracle';
  
  const yearFilter = year.length === 4 ? year.slice(2) : year;
  
  const yearWhere = isOracle 
    ? `TO_CHAR(t.CDB_CDATE, 'YY') = '${yearFilter}'`
    : `substr(t.CDB_CDATE, 7, 2) = '${yearFilter}'`;
  
  const monthExtract = isOracle 
    ? `TO_CHAR(t.CDB_CDATE, 'MM')`
    : `substr(t.CDB_CDATE, 4, 2)`;

  const query = `
    SELECT 
      ${monthExtract} as monat,
      COUNT(*) as anzahl
    FROM cs_ticket_ticket t
    WHERE ${yearWhere}
    GROUP BY ${monthExtract}
    ORDER BY monat
  `;

  const results = await db.queryAll(query);
  
  return results.map(row => ({
    monat: isOracle ? row.MONAT : row.monat,
    anzahl: isOracle ? row.ANZAHL : row.anzahl
  }));
}

export async function getClosedTicketsData(year = '26') {
  const db = getKpiDB();
  const isOracle = getDbType() === 'oracle';
  
  const yearFilter = year.length === 4 ? year.slice(2) : year;
  
  const yearWhere = isOracle 
    ? `TO_CHAR(p200.CDBPROT_ZEIT, 'YY') = '${yearFilter}'`
    : `substr(p200.CDBPROT_ZEIT, 7, 2) = '${yearFilter}'`;

  const zeitNeuCalc = isOracle 
    ? `ROUND((p80.CDBPROT_ZEIT - t.CDB_CDATE) * 24, 2) as zeit_neu_stunden`
    : `ROUND((julianday(p80.CDBPROT_ZEIT) - julianday(t.CDB_CDATE)) * 24, 2) as zeit_neu_stunden`;

  const dauerBearbeitungCalc = isOracle 
    ? `ROUND((p200.CDBPROT_ZEIT - p80.CDBPROT_ZEIT) * 24, 2) as dauer_bearbeitung_stunden`
    : `ROUND((julianday(p200.CDBPROT_ZEIT) - julianday(p80.CDBPROT_ZEIT)) * 24, 2) as dauer_bearbeitung_stunden`;

  const gesamtCalc = isOracle 
    ? `ROUND((p200.CDBPROT_ZEIT - t.CDB_CDATE) * 24, 2) as gesamt_stunden`
    : `ROUND((julianday(p200.CDBPROT_ZEIT) - julianday(t.CDB_CDATE)) * 24, 2) as gesamt_stunden`;

  const query = `
    SELECT 
      t.ticket_id,
      t.title_de,
      t.CDB_CDATE as erstellungsdatum,
      a.name as bearbeiter,
      ty.type_name_de as kategorie,
      pr.priority_name_de as prioritaet,
      p80.CDBPROT_ZEIT as start_bearbeitung,
      p200.CDBPROT_ZEIT as ende_bearbeitung,
      ${zeitNeuCalc},
      ${dauerBearbeitungCalc},
      ${gesamtCalc}
    FROM cs_ticket_ticket t
    JOIN cs_ticket_prot p200 ON t.ticket_id = p200.TICKET_ID 
      AND p200.CDBPROT_NEWSTATE = 200
    LEFT JOIN cs_ticket_prot p80 ON t.ticket_id = p80.TICKET_ID 
      AND p80.CDBPROT_NEWSTATE = 80
      AND p80.CDBPROT_ZEIT < p200.CDBPROT_ZEIT
    LEFT JOIN angestellter a ON t.agent = a.personalnummer
    LEFT JOIN cs_ticket_type ty ON t.type_id = ty.type_id
    LEFT JOIN cs_ticket_priority pr ON t.priority_id = pr.priority_id
    WHERE ${yearWhere}
    ORDER BY p200.CDBPROT_ZEIT DESC
  `;

  const results = await db.queryAll(query);
  
  return results.map(row => {
    const erstellungsdatumKey = isOracle ? 'ERSTELLUNGSDATUM' : 'erstellungsdatum';
    const startKey = isOracle ? 'START_BEARBEITUNG' : 'start_bearbeitung';
    const endKey = isOracle ? 'ENDE_BEARBEITUNG' : 'ende_bearbeitung';
    const ticketIdKey = isOracle ? 'TICKET_ID' : 'ticket_id';
    const titleKey = isOracle ? 'TITLE_DE' : 'title_de';
    const bearbeiterKey = isOracle ? 'BEARBEITER' : 'bearbeiter';
    const kategorieKey = isOracle ? 'KATEGORIE' : 'kategorie';
    const prioritaetKey = isOracle ? 'PRIORITAET' : 'prioritaet';
    const zeitNeuKey = isOracle ? 'ZEIT_NEU_STUNDEN' : 'zeit_neu_stunden';
    const dauerBearbeitungKey = isOracle ? 'DAUER_BEARBEITUNG_STUNDEN' : 'dauer_bearbeitung_stunden';
    const gesamtKey = isOracle ? 'GESAMT_STUNDEN' : 'gesamt_stunden';
    
    const erstellungsdatum = row[erstellungsdatumKey];
    const startTime = row[startKey];
    const endTime = row[endKey];
    
    // Zeit Status Neu (Erstellung → Status 80)
    const zeitNeuStunden = row[zeitNeuKey];
    const zeitNeuTage = zeitNeuStunden ? Math.round(zeitNeuStunden / 24 * 100) / 100 : null;
    const zeitNeuArbeitsstunden = calculateWorkingHours(erstellungsdatum, startTime);
    
    // Dauer Bearbeitung (Status 80 → Status 200)
    const dauerBearbeitungStunden = row[dauerBearbeitungKey];
    const dauerBearbeitungTage = dauerBearbeitungStunden ? Math.round(dauerBearbeitungStunden / 24 * 100) / 100 : null;
    const arbeitsstundenBearbeitung = calculateWorkingHours(startTime, endTime);
    
    // Gesamtdurchlaufzeit (Erstellung → Status 200)
    const gesamtStunden = row[gesamtKey];
    const gesamtTage = gesamtStunden ? Math.round(gesamtStunden / 24 * 100) / 100 : null;
    const gesamtArbeitsstunden = calculateWorkingHours(erstellungsdatum, endTime);
    
    return {
      ticketId: row[ticketIdKey],
      title: row[titleKey] || '',
      bearbeiter: row[bearbeiterKey] || 'Nicht zugewiesen',
      kategorie: row[kategorieKey] || 'Keine Kategorie',
      prioritaet: row[prioritaetKey] || 'Keine Priorität',
      startBearbeitung: startTime,
      endeBearbeitung: endTime,
      zeitStatusNeuStunden: zeitNeuStunden,
      zeitStatusNeuTage: zeitNeuTage,
      zeitStatusNeuArbeitsstunden: zeitNeuArbeitsstunden,
      dauerBearbeitungStunden: dauerBearbeitungStunden,
      dauerBearbeitungTage: dauerBearbeitungTage,
      arbeitsstundenBearbeitung: arbeitsstundenBearbeitung,
      gesamtStunden: gesamtStunden,
      gesamtTage: gesamtTage,
      gesamtArbeitsstunden: gesamtArbeitsstunden
    };
  });
}

export async function generateExcelReport(year = '26', outputPath = null) {
  const data = await getClosedTicketsData(year);
  const ticketsByCategory = await getNewTicketsByCategory(year);
  const ticketsByMonth = await getNewTicketsByMonth(year);
  
  const fullYear = 2000 + parseInt(year);
  const workingDays = getWorkingDaysInYear(fullYear);
  const totalNewTickets = ticketsByCategory.reduce((sum, cat) => sum + cat.anzahl, 0);
  const avgPerDay = workingDays > 0 ? totalNewTickets / workingDays : 0;
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ticket KPI Dashboard';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet(`Geschlossene Tickets 20${year}`);
  
  worksheet.columns = [
    { header: 'Ticketnummer', key: 'ticketId', width: 15 },
    { header: 'Titel', key: 'title', width: 50 },
    { header: 'Bearbeiter', key: 'bearbeiter', width: 25 },
    { header: 'Kategorie', key: 'kategorie', width: 20 },
    { header: 'Priorität', key: 'prioritaet', width: 15 },
    { header: 'Beginn Bearbeitung', key: 'startBearbeitung', width: 20 },
    { header: 'Abgeschlossen am', key: 'endeBearbeitung', width: 20 },
    { header: 'Zeit Status Neu (Stunden)', key: 'zeitStatusNeuStunden', width: 20 },
    { header: 'Zeit Status Neu (Tage)', key: 'zeitStatusNeuTage', width: 18 },
    { header: 'Zeit Status Neu (Arbeitsstunden)', key: 'zeitStatusNeuArbeitsstunden', width: 24 },
    { header: 'Dauer Bearbeitung (Stunden)', key: 'dauerBearbeitungStunden', width: 22 },
    { header: 'Dauer Bearbeitung (Tage)', key: 'dauerBearbeitungTage', width: 20 },
    { header: 'Arbeitsstunden Bearbeitung', key: 'arbeitsstundenBearbeitung', width: 22 },
    { header: 'Gesamtdurchlaufzeit (Stunden)', key: 'gesamtStunden', width: 24 },
    { header: 'Gesamtdurchlaufzeit (Tage)', key: 'gesamtTage', width: 22 },
    { header: 'Gesamtdurchlaufzeit (Arbeitsstunden)', key: 'gesamtArbeitsstunden', width: 28 }
  ];
  
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 16 }
  };
  
  data.forEach((row, index) => {
    const dataRow = worksheet.addRow({
      ticketId: row.ticketId,
      title: row.title,
      bearbeiter: row.bearbeiter,
      kategorie: row.kategorie,
      prioritaet: row.prioritaet,
      startBearbeitung: row.startBearbeitung,
      endeBearbeitung: row.endeBearbeitung,
      zeitStatusNeuStunden: row.zeitStatusNeuStunden,
      zeitStatusNeuTage: row.zeitStatusNeuTage,
      zeitStatusNeuArbeitsstunden: row.zeitStatusNeuArbeitsstunden,
      dauerBearbeitungStunden: row.dauerBearbeitungStunden,
      dauerBearbeitungTage: row.dauerBearbeitungTage,
      arbeitsstundenBearbeitung: row.arbeitsstundenBearbeitung,
      gesamtStunden: row.gesamtStunden,
      gesamtTage: row.gesamtTage,
      gesamtArbeitsstunden: row.gesamtArbeitsstunden
    });
    
    if (index % 2 === 1) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }
    
    dataRow.alignment = { vertical: 'middle' };
  });
  
  worksheet.getColumn('zeitStatusNeuStunden').numFmt = '0.00';
  worksheet.getColumn('zeitStatusNeuTage').numFmt = '0.00';
  worksheet.getColumn('zeitStatusNeuArbeitsstunden').numFmt = '0.0';
  worksheet.getColumn('dauerBearbeitungStunden').numFmt = '0.00';
  worksheet.getColumn('dauerBearbeitungTage').numFmt = '0.00';
  worksheet.getColumn('arbeitsstundenBearbeitung').numFmt = '0.0';
  worksheet.getColumn('gesamtStunden').numFmt = '0.00';
  worksheet.getColumn('gesamtTage').numFmt = '0.00';
  worksheet.getColumn('gesamtArbeitsstunden').numFmt = '0.0';
  
  const summarySheet = workbook.addWorksheet('Zusammenfassung');
  
  summarySheet.getCell('A1').value = 'Zusammenfassung';
  summarySheet.getCell('A1').font = { bold: true, size: 16 };
  summarySheet.getCell('A2').value = `Jahr: 20${year}`;
  summarySheet.getCell('A2').font = { bold: true, size: 12 };
  
  summarySheet.getCell('A4').value = 'Gesamt-Statistik';
  summarySheet.getCell('A4').font = { bold: true, size: 14 };
  summarySheet.getCell('A4').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  summarySheet.getCell('A4').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  summarySheet.getCell('A5').value = 'Anzahl Werkstage:';
  summarySheet.getCell('B5').value = workingDays;
  summarySheet.getCell('A6').value = 'Anzahl neue Tickets:';
  summarySheet.getCell('B6').value = totalNewTickets;
  summarySheet.getCell('A7').value = 'Durchschnitt pro Werktag:';
  summarySheet.getCell('B7').value = avgPerDay;
  summarySheet.getCell('B7').numFmt = '0.00';
  
  summarySheet.getCell('A9').value = 'Nach Kategorie';
  summarySheet.getCell('A9').font = { bold: true, size: 14 };
  summarySheet.getCell('A9').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  summarySheet.getCell('A9').font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  summarySheet.getCell('A10').value = 'Kategorie';
  summarySheet.getCell('B10').value = 'Anzahl Tickets';
  summarySheet.getCell('C10').value = 'Durchschnitt/Tag';
  summarySheet.getRow(10).font = { bold: true };
  summarySheet.getRow(10).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E2F3' }
  };
  
  ticketsByCategory.forEach((cat, index) => {
    const row = 11 + index;
    summarySheet.getCell(`A${row}`).value = cat.kategorie;
    summarySheet.getCell(`B${row}`).value = cat.anzahl;
    summarySheet.getCell(`C${row}`).value = workingDays > 0 ? cat.anzahl / workingDays : 0;
    summarySheet.getCell(`C${row}`).numFmt = '0.00';
  });
  
  const totalCatRow = 11 + ticketsByCategory.length;
  summarySheet.getCell(`A${totalCatRow}`).value = 'Gesamt';
  summarySheet.getCell(`A${totalCatRow}`).font = { bold: true };
  summarySheet.getCell(`B${totalCatRow}`).value = totalNewTickets;
  summarySheet.getCell(`B${totalCatRow}`).font = { bold: true };
  summarySheet.getCell(`C${totalCatRow}`).value = avgPerDay;
  summarySheet.getCell(`C${totalCatRow}`).numFmt = '0.00';
  summarySheet.getCell(`C${totalCatRow}`).font = { bold: true };
  
  const monthStartRow = totalCatRow + 3;
  summarySheet.getCell(`A${monthStartRow}`).value = 'Nach Monat';
  summarySheet.getCell(`A${monthStartRow}`).font = { bold: true, size: 14 };
  summarySheet.getCell(`A${monthStartRow}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  summarySheet.getCell(`A${monthStartRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  summarySheet.getCell(`A${monthStartRow + 1}`).value = 'Monat';
  summarySheet.getCell(`B${monthStartRow + 1}`).value = 'Werkstage';
  summarySheet.getCell(`C${monthStartRow + 1}`).value = 'Tickets';
  summarySheet.getCell(`D${monthStartRow + 1}`).value = 'Durchschnitt/Tag';
  summarySheet.getRow(monthStartRow + 1).font = { bold: true };
  summarySheet.getRow(monthStartRow + 1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E2F3' }
  };
  
  ticketsByMonth.forEach((month, index) => {
    const row = monthStartRow + 2 + index;
    const monthNum = parseInt(month.monat);
    const monthWorkingDays = getWorkingDaysInMonth(fullYear, monthNum - 1);
    const monthAvg = monthWorkingDays > 0 ? month.anzahl / monthWorkingDays : 0;
    
    summarySheet.getCell(`A${row}`).value = monthNames[month.monat] || month.monat;
    summarySheet.getCell(`B${row}`).value = monthWorkingDays;
    summarySheet.getCell(`C${row}`).value = month.anzahl;
    summarySheet.getCell(`D${row}`).value = monthAvg;
    summarySheet.getCell(`D${row}`).numFmt = '0.00';
  });
  
  summarySheet.columns = [
    { width: 25 },
    { width: 15 },
    { width: 18 },
    { width: 18 }
  ];
  
  if (outputPath) {
    await workbook.xlsx.writeFile(outputPath);
    console.log(`Excel-Datei erstellt: ${outputPath}`);
    console.log(`Anzahl geschlossene Tickets: ${data.length}`);
    console.log(`Anzahl neue Tickets: ${totalNewTickets}`);
    console.log(`Durchschnitt neue Tickets pro Werktag: ${avgPerDay.toFixed(2)}`);
    return outputPath;
  }
  
  return workbook;
}

export async function getExcelBuffer(year = '26') {
  const workbook = await generateExcelReport(year);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function runStandalone() {
  const year = process.argv[2] || '26';
  const outputFile = process.argv[3] || `geschlossene_tickets_20${year}.xlsx`;
  
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const outputPath = join(__dirname, '..', '..', outputFile);
  
  console.log(`\nExportiere geschlossene Tickets für Jahr 20${year}...`);
  console.log('Initialisiere Datenbankverbindung...');
  await initDB();
  await generateExcelReport(year, outputPath);
  process.exit(0);
}

const isMainModule = process.argv[1] && 
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());

if (isMainModule) {
  runStandalone();
}
