/**
 * @fileoverview Запись таблицы отчёта на лист Google Sheets.
 */
const MetrikaSheetWriter = (function () {
  function columnToIndex_(letters) {
    const s = String(letters).toUpperCase();
    let n = 0;
    for (var i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code < 65 || code > 90) {
        throw new Error('Неверная колонка в адресе ячейки: ' + letters);
      }
      n = n * 26 + (code - 64);
    }
    return n;
  }

  function parseAnchor_(anchor) {
    const t = String(anchor || '').trim();
    if (!t) {
      return null;
    }

    let sheetName = null;
    let cellPart = t;
    const bang = t.lastIndexOf('!');
    if (bang > 0) {
      sheetName = t.substring(0, bang).trim();
      if (sheetName.charAt(0) === "'" && sheetName.charAt(sheetName.length - 1) === "'") {
        sheetName = sheetName.substring(1, sheetName.length - 1);
      }
      cellPart = t.substring(bang + 1).trim();
    }

    const m = cellPart.match(/^([A-Za-z]+)(\d+)$/);
    if (!m) {
      throw new Error(
        'Неверный адрес ячейки «' + anchor + '». Примеры: A1, B10, Данные!C3'
      );
    }

    const row = parseInt(m[2], 10);
    if (row < 1) {
      throw new Error('Номер строки в адресе должен быть ≥ 1');
    }

    return {
      sheetName: sheetName,
      row: row,
      col: columnToIndex_(m[1]),
    };
  }

  function indexToColumn_(index) {
    let n = index;
    let s = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  }

  function formatAnchorLabel_(sheet, row, col) {
    return sheet.getName() + '!' + indexToColumn_(col) + row;
  }

  function formatCellRef_(row, col) {
    return indexToColumn_(col) + row;
  }

  function formatAnchor_(sheetName, cellRef) {
    const cellPart = String(cellRef || '')
      .trim()
      .toUpperCase();
    if (!cellPart) {
      throw new Error('Укажите ячейку (например A1).');
    }
    if (!/^[A-Z]+\d+$/.test(cellPart)) {
      throw new Error('Ячейка должна быть в формате A1, B10, AA100.');
    }
    parseAnchor_(cellPart);

    const sheet = String(sheetName || '').trim();
    if (!sheet) {
      return cellPart;
    }
    const needsQuote = /[^a-zA-Z0-9_]/.test(sheet) || /^\d/.test(sheet);
    const escaped = sheet.replace(/'/g, "''");
    const sheetPart = needsQuote ? "'" + escaped + "'" : sheet;
    return sheetPart + '!' + cellPart;
  }

  function parseAnchorParts_(anchor) {
    const pos = parseAnchor_(anchor);
    if (!pos) {
      return { sheetName: '', cellRef: 'A1' };
    }
    return {
      sheetName: pos.sheetName || '',
      cellRef: formatCellRef_(pos.row, pos.col),
    };
  }

  function writeToNewSheet_(sheetName, parsed) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet.clear();
    }
    return sheet;
  }

  function rowsForWrite_(parsed, includeHeaders) {
    const rows = (parsed && parsed.rows) || [];
    if (!rows.length) {
      return [];
    }
    if (includeHeaders !== false) {
      return rows;
    }
    return rows.length > 1 ? rows.slice(1) : [];
  }

  function writeToAnchor_(anchor, parsed, includeHeaders) {
    const pos = parseAnchor_(anchor);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet;
    if (pos.sheetName) {
      sheet = ss.getSheetByName(pos.sheetName);
      if (!sheet) {
        throw new Error('Лист не найден: «' + pos.sheetName + '»');
      }
    } else {
      sheet = ss.getActiveSheet();
      if (!sheet) {
        throw new Error('Нет активного листа');
      }
    }

    const data = rowsForWrite_(parsed, includeHeaders);
    if (!data.length) {
      return {
        sheetName: sheet.getName(),
        anchor: formatAnchorLabel_(sheet, pos.row, pos.col),
        mode: 'anchor',
      };
    }

    const numRows = data.length;
    const numCols = data[0].length;
    sheet.getRange(pos.row, pos.col, numRows, numCols).setValues(data);
    if (includeHeaders !== false) {
      sheet.getRange(pos.row, pos.col, 1, numCols).setFontWeight('bold');
    }

    return {
      sheetName: sheet.getName(),
      anchor: formatAnchorLabel_(sheet, pos.row, pos.col),
      mode: 'anchor',
    };
  }

  function write(target, parsed) {
    const includeHeaders = !target || target.includeHeaders !== false;
    const data = rowsForWrite_(parsed, includeHeaders);
    if (!data.length) {
      return { sheetName: '', anchor: '', mode: 'empty' };
    }

    const anchor = target && target.targetAnchor ? String(target.targetAnchor).trim() : '';
    if (anchor) {
      return writeToAnchor_(anchor, parsed, includeHeaders);
    }

    const sheetName =
      (target && target.sheetName) ||
      'Отчёт ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    const sheet = writeToNewSheet_(sheetName.substring(0, 100), { rows: data });
    const numCols = data[0].length;

    sheet.getRange(1, 1, data.length, numCols).setValues(data);
    if (includeHeaders) {
      sheet.getRange(1, 1, 1, numCols).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    sheet.autoResizeColumns(1, numCols);

    return {
      sheetName: sheet.getName(),
      anchor: 'A1',
      mode: 'newSheet',
    };
  }

  return {
    write: write,
    formatAnchor: formatAnchor_,
    parseAnchorParts: parseAnchorParts_,
  };
})();
