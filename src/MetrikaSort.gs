/**
 * @fileoverview Сортировка строк отчёта.
 */
const MetrikaSort = (function () {
  function parseDateMs_(value) {
    const s = String(value || '').trim();
    if (!s) {
      return NaN;
    }
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
    }
    const t = Date.parse(s);
    return isNaN(t) ? NaN : t;
  }

  function compareCells_(a, b, fieldId) {
    if (fieldId === 'ym:s:date' || fieldId === 'ym:s:datePeriod' || /date/i.test(fieldId)) {
      const da = parseDateMs_(a);
      const db = parseDateMs_(b);
      if (!isNaN(da) && !isNaN(db)) {
        return da - db;
      }
    }
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') {
      return na - nb;
    }
    return String(a).localeCompare(String(b), 'ru');
  }

  function applyToParsed(parsed, sortExpr) {
    if (!sortExpr || !parsed || !parsed.rows || parsed.rows.length < 2) {
      return parsed;
    }

    let field = String(sortExpr).trim();
    let desc = false;
    if (field.charAt(0) === '-') {
      desc = true;
      field = field.substring(1).trim();
    }

    const header = parsed.rows[0];
    let colIndex = -1;
    for (var i = 0; i < header.length; i++) {
      if (header[i] === field) {
        colIndex = i;
        break;
      }
    }
    if (colIndex < 0) {
      return parsed;
    }

    const body = parsed.rows.slice(1);
    body.sort(function (rowA, rowB) {
      const cmp = compareCells_(rowA[colIndex], rowB[colIndex], field);
      return desc ? -cmp : cmp;
    });
    parsed.rows = [header].concat(body);
    return parsed;
  }

  function optionsForUi() {
    return [
      { value: 'preset', label: 'По умолчанию для среза' },
      { value: 'ym:s:date', label: 'Дата ↓ (от старых к новым)' },
      { value: '-ym:s:date', label: 'Дата ↑ (от новых к старым)' },
      { value: '-ym:s:visits', label: 'Визиты ↓' },
      { value: 'ym:s:visits', label: 'Визиты ↑' },
      { value: '-ym:s:users', label: 'Пользователи ↓' },
      { value: 'ym:s:users', label: 'Пользователи ↑' },
    ];
  }

  return {
    applyToParsed: applyToParsed,
    optionsForUi: optionsForUi,
  };
})();
