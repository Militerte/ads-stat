/**
 * @fileoverview Загрузка отчёта Директа и запись на лист.
 */
const DirectReport = (function () {
  function getToken_() {
    if (!YandexAuth.hasAccess()) {
      throw new Error('Сначала войдите через Яндекс в дополнении.');
    }
    return YandexAuth.getAccessToken();
  }

  function splitCsv_(value) {
    return String(value || '')
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function resolveParams(request) {
    const dimensions = splitCsv_(request.customDimensions);
    const metrics = splitCsv_(request.customMetrics);
    if (!metrics.length) {
      throw new Error('Для отчёта Директа укажите хотя бы одну метрику.');
    }

    const fieldNames = dimensions.concat(metrics);
    const dates = MetrikaDates.resolveFromRequest(request);
    const firstDimension = dimensions.length ? dimensions[0] : '';

    return {
      token: getToken_(),
      reportType: DirectAttrCatalog.REPORT_TYPE,
      fieldNames: fieldNames,
      dimensions: dimensions,
      metrics: metrics,
      date1: dates.date1,
      date2: dates.date2,
      orderByField: firstDimension,
      campaignIds: request.directCampaignIds || '',
      reportLabel: 'Директ',
      reportName: 'AdsStat_' + Utilities.getUuid().substring(0, 8),
    };
  }

  function applyHeaderLabels_(rows) {
    if (!rows || !rows.length) {
      return rows;
    }
    rows[0] = rows[0].map(function (id) {
      return DirectAttrCatalog.labelForId(id);
    });
    return rows;
  }

  function loadAndWrite(request) {
    const params = resolveParams(request);
    var rows = DirectApi.fetchReport({
      token: params.token,
      reportType: params.reportType,
      fieldNames: params.fieldNames,
      date1: params.date1,
      date2: params.date2,
      orderByField: params.orderByField,
      reportName: params.reportName,
      campaignIds: params.campaignIds,
    });

    if (!rows.length) {
      rows = [params.fieldNames];
    }

    rows = applyHeaderLabels_(rows);

    const parsed = {
      rows: rows,
      sampled: false,
    };

    const targetAnchor = String(request.targetAnchor || '').trim();
    const autoSheetName = (params.reportLabel + ' ' + params.date1 + '–' + params.date2).substring(0, 100);
    const writeInfo = MetrikaSheetWriter.write(
      {
        targetAnchor: targetAnchor,
        sheetName: request.sheetName || autoSheetName,
        includeHeaders: request.showColumnHeaders !== false,
      },
      parsed
    );

    return {
      rowCount: Math.max(0, rows.length - 1),
      sampled: false,
      sheetName: writeInfo.sheetName,
      anchor: writeInfo.anchor,
      writeMode: writeInfo.mode,
    };
  }

  return {
    loadAndWrite: loadAndWrite,
    resolveParams: resolveParams,
  };
})();
