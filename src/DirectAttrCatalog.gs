/**
 * @fileoverview Справочник группировок и метрик для отчётов Директа (CUSTOM_REPORT).
 */
const DirectAttrCatalog = (function () {
  const REPORT_TYPE = 'CUSTOM_REPORT';

  const DIMENSIONS = [
    { id: 'Date', label: 'День' },
    { id: 'CampaignId', label: 'ID кампании' },
    { id: 'CampaignName', label: 'Название кампании' },
    { id: 'AdGroupId', label: 'ID группы объявлений' },
    { id: 'AdGroupName', label: 'Название группы' },
    { id: 'AdId', label: 'ID объявления' },
  ];

  const METRICS = [
    { id: 'Impressions', label: 'Показы' },
    { id: 'Clicks', label: 'Клики' },
    { id: 'Cost', label: 'Расход' },
  ];

  const LABEL_BY_ID = (function () {
    const map = {};
    DIMENSIONS.forEach(function (item) {
      map[item.id] = item.label;
    });
    METRICS.forEach(function (item) {
      map[item.id] = item.label;
    });
    return map;
  })();

  function labelForId(id) {
    return LABEL_BY_ID[id] || id;
  }

  function listForUi() {
    return {
      reportType: REPORT_TYPE,
      dimensions: DIMENSIONS,
      metrics: METRICS,
    };
  }

  return {
    REPORT_TYPE: REPORT_TYPE,
    listForUi: listForUi,
    labelForId: labelForId,
  };
})();
