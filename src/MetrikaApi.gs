/**
 * @fileoverview Клиент Reporting API и Management API Яндекс Метрики.
 */
const MetrikaApi = (function () {
  const BASE_STAT = 'https://api-metrika.yandex.net/stat/v1/data';
  const BASE_MGMT = 'https://api-metrika.yandex.net/management/v1';
  const DATE_ONLY_DIMENSION = 'ym:s:date';
  const CHUNK_DAYS_DEFAULT = 31;
  const CHUNK_DAYS_FALLBACK = 14;

  function getToken_() {
    if (!YandexAuth.hasAccess()) {
      throw new Error('Войдите через Яндекс в дополнении.');
    }
    return YandexAuth.getAccessToken();
  }

  function authHeaders(token) {
    const t = String(token || '').trim();
    if (!t) {
      throw new Error('Токен Яндекса не получен. Войдите снова.');
    }
    return {
      Authorization: 'OAuth ' + t,
      Accept: 'application/json',
    };
  }

  function formatApiError_(context, code, body) {
    if (code === 403) {
      return (
        context +
        ': доступ запрещён (HTTP 403). Проверьте право metrika:read и доступ к счётчику.\n' +
        body.substring(0, 200)
      );
    }
    if (code === 401) {
      return context + ': токен недействителен (HTTP 401). Войдите снова.\n' + body.substring(0, 200);
    }
    return context + ': HTTP ' + code + ' — ' + body.substring(0, 300);
  }

  function isQueryTooComplicatedBody_(body) {
    const s = String(body || '').toLowerCase();
    return (
      s.indexOf('too complicated') >= 0 ||
      s.indexOf('query_error') >= 0 ||
      s.indexOf('reduce the date interval') >= 0
    );
  }

  function isQueryTooComplicatedError_(err) {
    const msg = String((err && err.message) || err || '').toLowerCase();
    return msg.indexOf('too complicated') >= 0 || msg.indexOf('query_error') >= 0;
  }

  function fetchReportWithAccuracy_(params, accuracy) {
    const query = {
      id: params.counterId,
      metrics: params.metrics,
      date1: params.date1,
      date2: params.date2,
      limit: params.limit || 10000,
      accuracy: accuracy,
    };
    if (params.dimensions) {
      query.dimensions = params.dimensions;
    }
    if (params.filters) {
      query.filters = params.filters;
    }
    if (params.sort) {
      query.sort = params.sort;
    }

    const url =
      BASE_STAT +
      '?' +
      Object.keys(query)
        .map(function (k) {
          return encodeURIComponent(k) + '=' + encodeURIComponent(String(query[k]));
        })
        .join('&');

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: authHeaders(params.token),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    const body = response.getContentText();
    if (code !== 200) {
      const err = new Error(formatApiError_('Отчёт Метрики', code, body));
      throw err;
    }
    return JSON.parse(body);
  }

  function fetchReportWithAccuracyFallback_(params) {
    const accuracies = ['medium', 'low', '0.01'];
    var lastErr = null;
    for (var i = 0; i < accuracies.length; i++) {
      try {
        return fetchReportWithAccuracy_(params, accuracies[i]);
      } catch (e) {
        lastErr = e;
        if (!isQueryTooComplicatedError_(e) || i === accuracies.length - 1) {
          throw e;
        }
      }
    }
    throw lastErr;
  }

  function isDateOnlyDimensions_(dimensions) {
    const parts = String(dimensions || '')
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    return parts.length === 1 && parts[0] === DATE_ONLY_DIMENSION;
  }

  function mergeApiResponses_(base, extra) {
    if (!base) {
      return extra;
    }
    if (!extra) {
      return base;
    }
    const merged = base;
    if (extra.data && extra.data.length) {
      merged.data = (merged.data || []).concat(extra.data);
    }
    merged.sampled = !!(merged.sampled || extra.sampled);
    merged.total_rows = merged.data ? merged.data.length : 0;
    return merged;
  }

  function fetchReportChunkedByDays_(params, chunkSize) {
    const days = MetrikaDates.eachDayInRange(params.date1, params.date2);
    var merged = null;
    for (var i = 0; i < days.length; i += chunkSize) {
      const slice = days.slice(i, i + chunkSize);
      const sub = Object.assign({}, params, {
        date1: slice[0],
        date2: slice[slice.length - 1],
      });
      merged = mergeApiResponses_(merged, fetchReportWithAccuracyFallback_(sub));
    }
    return merged;
  }

  function fetchReport(params) {
    const token = params.token || getToken_();
    const full = Object.assign({}, params, { token: token });

    if (isDateOnlyDimensions_(full.dimensions)) {
      const days = MetrikaDates.eachDayInRange(full.date1, full.date2);
      if (days.length > CHUNK_DAYS_DEFAULT) {
        return fetchReportChunkedByDays_(full, CHUNK_DAYS_DEFAULT);
      }
    }

    try {
      return fetchReportWithAccuracyFallback_(full);
    } catch (e) {
      if (isQueryTooComplicatedError_(e) && isDateOnlyDimensions_(full.dimensions)) {
        const days = MetrikaDates.eachDayInRange(full.date1, full.date2);
        if (days.length > 7) {
          return fetchReportChunkedByDays_(full, CHUNK_DAYS_FALLBACK);
        }
      }
      throw e;
    }
  }

  function listCounters(token) {
    const t = token || getToken_();
    const url = BASE_MGMT + '/counters?per_page=1000';
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: authHeaders(t),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    const body = response.getContentText();
    if (code !== 200) {
      throw new Error(formatApiError_('Список счётчиков', code, body));
    }

    const json = JSON.parse(body);
    return (json.counters || []).map(function (c) {
      return {
        id: String(c.id),
        name: c.name || 'Счётчик ' + c.id,
        site: c.site || '',
      };
    });
  }

  function listGoals(token, counterId) {
    const url = BASE_MGMT + '/counter/' + encodeURIComponent(String(counterId)) + '/goals';
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: authHeaders(token || getToken_()),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    const body = response.getContentText();
    if (code !== 200) {
      throw new Error(formatApiError_('Список целей', code, body));
    }

    const json = JSON.parse(body);
    return (json.goals || []).map(function (g) {
      return {
        id: String(g.id),
        name: g.name || 'Цель ' + g.id,
        type: g.type || '',
      };
    });
  }

  return {
    fetchReport: fetchReport,
    listCounters: listCounters,
    listGoals: listGoals,
  };
})();
