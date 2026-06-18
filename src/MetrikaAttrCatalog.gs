/**
 * @fileoverview Справочник группировок и метрик для произвольного среза.
 */
const MetrikaAttrCatalog = (function () {
  const DIMENSIONS = [
    { id: 'ym:s:date', label: 'Дата' },
    { id: 'ym:s:UTMSource', label: 'UTM Source' },
    { id: 'ym:s:UTMMedium', label: 'UTM Medium' },
    { id: 'ym:s:UTMCampaign', label: 'UTM Campaign' },
    { id: 'ym:s:UTMContent', label: 'UTM Content' },
    { id: 'ym:s:UTMTerm', label: 'UTM Term' },
    { id: 'ym:s:trafficSource', label: 'Источник трафика' },
  ];

  const METRICS = [
    { id: 'ym:s:visits', label: 'Визиты' },
    { id: 'ym:s:users', label: 'Пользователи' },
    { id: 'ym:s:pageviews', label: 'Просмотры' },
    { id: 'ym:s:bounceRate', label: 'Отказы' },
    { id: 'ym:s:pageDepth', label: 'Глубина' },
    { id: 'ym:s:avgVisitDurationSeconds', label: 'Время' },
    { id: 'ym:s:robotPercentage', label: 'Роботность' },
    { id: 'ym:s:newUsers', label: 'Новые пользователи' },
    { id: 'ym:s:percentNewVisitors', label: 'Доля новых, %' },
    { id: 'ym:s:anyGoalReaches', label: 'Достижения любой цели' },
    { id: 'ym:s:anyGoalConversionRate', label: 'Конверсия любой цели, %' },
    { id: 'ym:pv:pageviews', label: 'Просмотры (хит)' },
    { id: 'ym:pv:users', label: 'Пользователи (хит)' },
  ];

  const EXTRA_LABELS = {
    'ym:s:goal reaches': 'Достижения',
    'ym:s:goal conversionRate': 'Конверсия',
    'ym:s:goal users': 'Пользователи',
  };

  const LABEL_BY_ID = (function () {
    const map = {};
    DIMENSIONS.forEach(function (item) {
      map[item.id] = item.label;
    });
    METRICS.forEach(function (item) {
      map[item.id] = item.label;
    });
    Object.keys(EXTRA_LABELS).forEach(function (id) {
      map[id] = EXTRA_LABELS[id];
    });
    return map;
  })();

  function labelForId(id) {
    if (LABEL_BY_ID[id]) {
      return LABEL_BY_ID[id];
    }
    if (/^ym:s:goal(\d+)reaches$/.test(id)) {
      return 'Достижения';
    }
    if (/^ym:s:goal(\d+)conversionRate$/.test(id)) {
      return 'Конверсия';
    }
    return id;
  }

  function listForUi() {
    return {
      dimensions: DIMENSIONS,
      metrics: METRICS,
    };
  }

  return {
    listForUi: listForUi,
    labelForId: labelForId,
  };
})();
