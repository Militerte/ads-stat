/**
 * @fileoverview Период отчёта Метрики.
 */
const MetrikaDates = (function () {
  const MSK_TZ = 'Europe/Moscow';

  function getTimezone() {
    try {
      return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || MSK_TZ;
    } catch (e) {
      return MSK_TZ;
    }
  }

  function formatDate(date, tz) {
    return Utilities.formatDate(date, tz || getTimezone(), 'yyyy-MM-dd');
  }

  function formatLastRunAtDisplay(iso) {
    if (!iso) {
      return '';
    }
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) {
        return '';
      }
      return Utilities.formatDate(d, MSK_TZ, 'yyyy-MM-dd HH:mm');
    } catch (e) {
      return '';
    }
  }

  function yesterdayStr() {
    return formatDate(new Date(Date.now() - 86400000), getTimezone());
  }

  function todayStr() {
    return formatDate(new Date(), getTimezone());
  }

  function resolveFromRequest(request) {
    if (request && request.dateMode) {
      return resolveFromSaved(request);
    }
    return resolve(request.date1, request.date2, !!request.excludeToday);
  }

  function resolveFromSaved(saved) {
    const excludeToday = !!saved.excludeToday;
    if (saved.dateMode === 'fixed') {
      return resolve(saved.date1, saved.date2, excludeToday);
    }
    const days = Math.max(1, parseInt(saved.relativeDays, 10) || 30);
    const tz = getTimezone();
    const end = excludeToday ? new Date(Date.now() - 86400000) : new Date();
    const date2 = formatDate(end, tz);
    const start = new Date(end.getTime() - (days - 1) * 86400000);
    const date1 = formatDate(start, tz);
    return { date1: date1, date2: date2 };
  }

  function resolve(date1, date2, excludeToday) {
    const d1 = String(date1 || '').trim();
    let d2 = String(date2 || '').trim();
    if (!d1 || !d2) {
      throw new Error('Укажите даты начала и конца периода.');
    }
    if (excludeToday) {
      d2 = yesterdayStr();
      if (d1 > d2) {
        throw new Error('Дата «с» позже вчера. Сдвиньте период или отключите «Исключить сегодня».');
      }
    } else if (d1 > d2) {
      throw new Error('Дата «с» не может быть позже даты «по».');
    }
    return { date1: d1, date2: d2 };
  }

  function parseYmd_(ymd) {
    const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
      return null;
    }
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function normalizeDateKey(value) {
    const s = String(value || '').trim();
    if (!s) {
      return '';
    }
    const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) {
      return iso[1];
    }
    const dmy = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if (dmy) {
      return dmy[3] + '-' + dmy[2] + '-' + dmy[1];
    }
    const t = Date.parse(s);
    if (!isNaN(t)) {
      return formatDate(new Date(t), getTimezone());
    }
    return '';
  }

  function eachDayInRange(date1, date2) {
    const start = parseYmd_(date1);
    const end = parseYmd_(date2);
    if (!start || !end || start.getTime() > end.getTime()) {
      return [];
    }
    const tz = getTimezone();
    const out = [];
    const cur = new Date(start.getTime());
    while (cur.getTime() <= end.getTime()) {
      out.push(formatDate(cur, tz));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }

  return {
    resolve: resolve,
    resolveFromRequest: resolveFromRequest,
    resolveFromSaved: resolveFromSaved,
    yesterdayStr: yesterdayStr,
    todayStr: todayStr,
    getTimezone: getTimezone,
    formatLastRunAtDisplay: formatLastRunAtDisplay,
    normalizeDateKey: normalizeDateKey,
    eachDayInRange: eachDayInRange,
  };
})();
