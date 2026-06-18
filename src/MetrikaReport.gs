/**
 * @fileoverview Загрузка отчёта Метрики и запись на лист.
 */
const MetrikaReport = (function () {
  function getToken_() {
    if (!YandexAuth.hasAccess()) {
      throw new Error('Сначала войдите через Яндекс в дополнении.');
    }
    return YandexAuth.getAccessToken();
  }

  function resolveSortExpr_(request, defaultSort) {
    if (request.sort && String(request.sort).trim() && request.sort !== 'preset') {
      return String(request.sort).trim();
    }
    return defaultSort || '';
  }

  function resolveParams(request) {
    const token = getToken_();
    const preset = MetrikaPresets.getById(request.presetId);

    let dimensions;
    let metrics;
    let sort;
    let presetFilters = '';

    if (request.presetId === 'custom') {
      dimensions = (request.customDimensions || '').trim();
      metrics = (request.customMetrics || '').trim();
      if (!metrics) {
        throw new Error('Для произвольного отчёта укажите хотя бы одну метрику.');
      }
      const firstMetric = metrics.split(',')[0].trim();
      sort = resolveSortExpr_(request, firstMetric ? '-' + firstMetric : '-ym:s:visits');
    } else {
      if (!preset) {
        throw new Error('Неизвестный пресет: ' + request.presetId);
      }
      if (preset.usesGoalsApi) {
        const counterId = String(request.counterId || MetrikaStorage.getCounterId());
        const goalParams = MetrikaGoals.resolveReportParams(token, counterId);
        dimensions = goalParams.dimensions;
        metrics = goalParams.metrics;
        sort = resolveSortExpr_(request, goalParams.sort);
        presetFilters = preset.filters || '';
        const filters = MetrikaUtmFilters.build(request.utmFilters, presetFilters);
        const dates = MetrikaDates.resolveFromRequest(request);
        var presetLabel = preset.label;
        if (MetrikaUtmFilters.hasAny(request.utmFilters)) {
          presetLabel += ' + UTM';
        }
        return buildResolved_(
          request,
          preset,
          dimensions,
          metrics,
          sort,
          presetFilters,
          goalParams.nameById,
          dates,
          token,
          presetLabel,
          filters
        );
      }
      dimensions = preset.dimensions;
      if (request.presetId === 'utm') {
        dimensions = MetrikaUtmFilters.adjustPresetDimensions(preset.dimensions, request.utmFilters);
      }
      metrics = preset.metrics;
      sort = resolveSortExpr_(request, preset.sort);
      presetFilters = preset.filters || '';
    }

    const filters = MetrikaUtmFilters.build(request.utmFilters, presetFilters);
    var label = preset ? preset.label : 'Произвольный';
    if (MetrikaUtmFilters.hasAny(request.utmFilters)) {
      label += ' + UTM';
    }
    const dates = MetrikaDates.resolveFromRequest(request);

    return buildResolved_(
      request,
      preset,
      dimensions,
      metrics,
      sort,
      presetFilters,
      null,
      dates,
      token,
      label,
      filters
    );
  }

  function buildResolved_(
    request,
    preset,
    dimensions,
    metrics,
    sort,
    presetFilters,
    goalNameById,
    datesOpt,
    tokenOpt,
    presetLabelOpt,
    filtersOpt
  ) {
    const token = tokenOpt || getToken_();
    const dates = datesOpt || MetrikaDates.resolveFromRequest(request);
    var presetLabel = presetLabelOpt;
    if (!presetLabel) {
      presetLabel = preset ? preset.label : 'Произвольный';
      if (MetrikaUtmFilters.hasAny(request.utmFilters)) {
        presetLabel += ' + UTM';
      }
    }
    const filters =
      filtersOpt !== undefined
        ? filtersOpt
        : MetrikaUtmFilters.build(request.utmFilters, presetFilters);

    if (!String(dimensions || '').trim()) {
      sort = '';
    }

    return {
      token: token,
      counterId: String(request.counterId || MetrikaStorage.getCounterId()),
      metrics: metrics,
      dimensions: dimensions,
      date1: dates.date1,
      date2: dates.date2,
      filters: filters,
      sort: sort,
      presetLabel: presetLabel,
      goalNameById: goalNameById || null,
    };
  }

  function dimensionLabel(dim, goalNameById) {
    if (!dim) {
      return '';
    }
    if (typeof dim === 'string') {
      return dim;
    }
    if (goalNameById) {
      return MetrikaGoals.formatGoalDimension_(goalNameById, dim);
    }
    if (dim.name !== undefined) {
      return String(dim.name);
    }
    if (dim.id !== undefined) {
      return String(dim.id);
    }
    return JSON.stringify(dim);
  }

  function parseTable(apiResponse, dimensionIds, metricIds, goalNameById) {
    const dimIds = dimensionIds || (apiResponse.query && apiResponse.query.dimensions) || [];
    const metIds = metricIds || (apiResponse.query && apiResponse.query.metrics) || [];
    const rows = apiResponse.data || [];
    const header = dimIds.concat(metIds);
    const table = [header];

    rows.forEach(function (row) {
      const dimVals = (row.dimensions || []).map(function (d) {
        return dimensionLabel(d, goalNameById);
      });
      const metVals = (row.metrics || []).map(function (m, index) {
        return MetrikaFormat.metricValue(metIds[index] || '', m);
      });
      table.push(dimVals.concat(metVals));
    });

    return {
      header: header,
      rows: table,
      totalRows: apiResponse.total_rows || rows.length,
      sampled: !!apiResponse.sampled,
    };
  }

  function isDateOnlyDimensions_(dimensions) {
    const parts = String(dimensions || '')
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    return parts.length === 1 && parts[0] === 'ym:s:date';
  }

  function fillMissingDateRows_(parsed, date1, date2, dimensions) {
    if (!isDateOnlyDimensions_(dimensions) || !parsed.rows || !parsed.rows.length) {
      return parsed;
    }
    const header = parsed.rows[0];
    if (header[0] !== 'ym:s:date') {
      return parsed;
    }

    const days = MetrikaDates.eachDayInRange(date1, date2);
    const byDate = {};
    parsed.rows.slice(1).forEach(function (row) {
      const key = MetrikaDates.normalizeDateKey(row[0]);
      if (key) {
        byDate[key] = row;
      }
    });

    const zeroMetrics = [];
    for (var c = 1; c < header.length; c++) {
      zeroMetrics.push(MetrikaFormat.metricValue(header[c], 0));
    }

    const filled = [header];
    days.forEach(function (day) {
      filled.push(byDate[day] || [day].concat(zeroMetrics));
    });
    parsed.rows = filled;
    return parsed;
  }

  function applyHeaderLabels_(parsed) {
    if (!parsed.rows || !parsed.rows.length) {
      return parsed;
    }
    parsed.rows[0] = parsed.rows[0].map(function (id) {
      return MetrikaAttrCatalog.labelForId(id);
    });
    return parsed;
  }

  function loadAndWrite(request) {
    const params = resolveParams(request);
    if (!params.counterId) {
      throw new Error('Укажите ID счётчика.');
    }

    var parsed = params.goalNameById
      ? MetrikaGoals.fetchReport(params)
      : parseTable(
          MetrikaApi.fetchReport({
            token: params.token,
            counterId: params.counterId,
            metrics: params.metrics,
            dimensions: params.dimensions,
            date1: params.date1,
            date2: params.date2,
            filters: params.filters,
            sort: params.sort,
          }),
          null,
          null,
          null
        );

    parsed = fillMissingDateRows_(parsed, params.date1, params.date2, params.dimensions);
    parsed = MetrikaSort.applyToParsed(parsed, params.sort);
    parsed = applyHeaderLabels_(parsed);

    const targetAnchor = String(request.targetAnchor || '').trim();
    const autoSheetName = (params.presetLabel + ' ' + params.date1 + '–' + params.date2).substring(0, 100);
    const writeInfo = MetrikaSheetWriter.write(
      {
        targetAnchor: targetAnchor,
        sheetName: request.sheetName || autoSheetName,
        includeHeaders: request.showColumnHeaders !== false,
      },
      parsed
    );

    MetrikaStorage.saveLastRequest(
      Object.assign({}, request, { counterId: params.counterId, targetAnchor: targetAnchor })
    );
    MetrikaStorage.setCounter(params.counterId, request.counterName || '');

    return {
      rowCount: parsed.rows.length - 1,
      sampled: parsed.sampled,
      sheetName: writeInfo.sheetName,
      anchor: writeInfo.anchor,
      writeMode: writeInfo.mode,
    };
  }

  return {
    loadAndWrite: loadAndWrite,
    parseTable: parseTable,
  };
})();
