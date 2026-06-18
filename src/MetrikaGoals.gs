/**
 * @fileoverview Отчёты по целям.
 */
const MetrikaGoals = (function () {
  function resolveReportParams(token, counterId) {
    const goals = MetrikaApi.listGoals(token, counterId);
    const nameById = {};
    goals.forEach(function (g) {
      nameById[g.id] = g.name;
    });

    if (!goals.length) {
      throw new Error(
        'У счётчика нет настроенных целей. Создайте цели в интерфейсе metrika.yandex.ru.'
      );
    }

    return {
      dimensions: 'ym:s:goal',
      metrics: 'ym:s:goal reaches,ym:s:goal conversionRate,ym:s:goal users',
      sort: '-ym:s:goal reaches',
      nameById: nameById,
    };
  }

  function formatGoalDimension_(nameById, dim) {
    if (!dim) {
      return '';
    }
    if (typeof dim === 'string') {
      return nameById[dim] || dim;
    }
    if (dim.name) {
      return String(dim.name);
    }
    if (dim.id !== undefined && dim.id !== null) {
      const id = String(dim.id);
      return nameById[id] || id;
    }
    return JSON.stringify(dim);
  }

  function fetchReportWide_(token, counterId, baseParams) {
    const goals = MetrikaApi.listGoals(token, counterId);
    if (!goals.length) {
      throw new Error('У счётчика нет настроенных целей.');
    }

    const metricParts = [];
    goals.forEach(function (g) {
      metricParts.push('ym:s:goal' + g.id + 'reaches');
      metricParts.push('ym:s:goal' + g.id + 'conversionRate');
    });

    const apiResponse = MetrikaApi.fetchReport({
      token: token,
      counterId: counterId,
      metrics: metricParts.join(','),
      date1: baseParams.date1,
      date2: baseParams.date2,
      filters: baseParams.filters,
    });

    const row = apiResponse.data && apiResponse.data[0];
    const values = row && row.metrics ? row.metrics : [];
    const header = ['Цель', 'Достижения', 'Конверсия, %'];
    const table = [header];

    goals.forEach(function (g, index) {
      const reaches = values[index * 2];
      const conv = values[index * 2 + 1];
      table.push([
        g.name,
        reaches !== undefined && reaches !== null ? reaches : '',
        conv !== undefined && conv !== null
          ? MetrikaFormat.metricValue('conversionRate', conv)
          : '',
      ]);
    });

    return {
      header: header,
      rows: table,
      totalRows: goals.length,
      sampled: !!apiResponse.sampled,
    };
  }

  function fetchReport(params) {
    try {
      const apiResponse = MetrikaApi.fetchReport({
        token: params.token,
        counterId: params.counterId,
        metrics: params.metrics,
        dimensions: params.dimensions,
        date1: params.date1,
        date2: params.date2,
        filters: params.filters,
        sort: params.sort,
      });
      const parsed = MetrikaReport.parseTable(apiResponse, null, null, params.goalNameById);
      return MetrikaSort.applyToParsed(parsed, params.sort);
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.indexOf('HTTP 400') === -1 && msg.indexOf('invalid_parameter') === -1) {
        throw e;
      }
      return fetchReportWide_(params.token, params.counterId, params);
    }
  }

  return {
    resolveReportParams: resolveReportParams,
    formatGoalDimension_: formatGoalDimension_,
    fetchReport: fetchReport,
  };
})();
