/**
 * @fileoverview Форматирование значений метрик для вывода в таблицу.
 */
const MetrikaFormat = (function () {
  const ONE_DECIMAL = {
    'ym:s:bounceRate': true,
    'ym:s:pageDepth': true,
    'ym:s:robotPercentage': true,
  };

  const INTEGER = {
    'ym:s:avgVisitDurationSeconds': true,
  };

  function metricValue(metricId, value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (INTEGER[metricId]) {
      const n = Number(value);
      if (!isNaN(n)) {
        return Math.round(n);
      }
    }
    if (!ONE_DECIMAL[metricId]) {
      return value;
    }
    const n = Number(value);
    if (isNaN(n)) {
      return value;
    }
    return Math.round(n * 10) / 10;
  }

  return {
    metricValue: metricValue,
  };
})();
