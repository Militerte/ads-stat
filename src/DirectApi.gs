/**
 * @fileoverview Клиент Reports API Яндекс.Директа v5.
 */
const DirectApi = (function () {
  const REPORTS_URL = 'https://api.direct.yandex.com/json/v5/reports';
  const MAX_POLL_ATTEMPTS = 45;
  const DEFAULT_RETRY_SEC = 5;

  function getToken_() {
    if (!YandexAuth.hasAccess()) {
      throw new Error('Войдите через Яндекс в дополнении.');
    }
    return YandexAuth.getAccessToken();
  }

  function getClientLogin_() {
    try {
      const info = YandexAuth.fetchUserInfo();
      return String(info.login || info.default_email || '').trim();
    } catch (e) {
      Logger.log('DirectApi.getClientLogin_: ' + e);
      return '';
    }
  }

  function buildHeaders_(token, clientLogin) {
    const headers = {
      Authorization: 'Bearer ' + token,
      'Accept-Language': 'ru',
      processingMode: 'auto',
      returnMoneyInMicros: 'false',
      skipReportHeader: 'true',
      skipReportSummary: 'true',
    };
    if (clientLogin) {
      headers['Client-Login'] = clientLogin;
    }
    return headers;
  }

  function formatApiError_(code, body) {
    const text = String(body || '').trim();
    if (code === 401) {
      return 'Директ: токен недействителен (HTTP 401). Войдите снова.';
    }
    if (code === 403) {
      return (
        'Директ: доступ запрещён (HTTP 403). Проверьте scope direct:api и заявку на API Директа.\n' +
        text.substring(0, 300)
      );
    }
    try {
      const json = JSON.parse(text);
      if (json.error) {
        const err = json.error;
        return (
          'Директ: ' +
          (err.error_string || err.error_detail || err.message || 'ошибка API') +
          (err.error_detail && err.error_string ? ' — ' + err.error_detail : '')
        );
      }
    } catch (e) {
      /* not JSON */
    }
    return 'Директ: HTTP ' + code + ' — ' + text.substring(0, 400);
  }

  function getRetrySeconds_(response) {
    const headers = response.getHeaders() || {};
    const raw =
      headers['Retry-In'] ||
      headers['retryIn'] ||
      headers['retry-in'] ||
      DEFAULT_RETRY_SEC;
    const sec = parseInt(raw, 10);
    return isNaN(sec) || sec < 1 ? DEFAULT_RETRY_SEC : Math.min(sec, 60);
  }

  function fetchReportOnce_(body, headers) {
    return UrlFetchApp.fetch(REPORTS_URL, {
      method: 'post',
      contentType: 'application/json; charset=utf-8',
      headers: headers,
      payload: JSON.stringify(body),
      muteHttpExceptions: true,
    });
  }

  function pollReport_(body, headers) {
    var lastCode = 0;
    var lastBody = '';
    for (var attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const response = fetchReportOnce_(body, headers);
      lastCode = response.getResponseCode();
      lastBody = response.getContentText();

      if (lastCode === 200) {
        return lastBody;
      }
      if (lastCode === 201 || lastCode === 202) {
        Utilities.sleep(getRetrySeconds_(response) * 1000);
        continue;
      }
      throw new Error(formatApiError_(lastCode, lastBody));
    }
    throw new Error(
      'Превышено время ожидания отчёта Директа (HTTP ' + lastCode + '). ' + lastBody.substring(0, 200)
    );
  }

  function parseTsv_(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    const rows = [];
    for (var i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) {
        continue;
      }
      rows.push(line.split('\t'));
    }
    return rows;
  }

  function parseCampaignIds_(value) {
    return String(value || '')
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function buildReportBody_(params) {
    const fieldNames = params.fieldNames || [];
    if (!fieldNames.length) {
      throw new Error('Укажите хотя бы одно поле отчёта Директа.');
    }

    const selectionCriteria = {
      DateFrom: params.date1,
      DateTo: params.date2,
    };

    const campaignIds = parseCampaignIds_(params.campaignIds);
    if (campaignIds.length) {
      selectionCriteria.Filter = [
        {
          Field: 'CampaignId',
          Operator: 'IN',
          Values: campaignIds,
        },
      ];
    }

    const body = {
      params: {
        SelectionCriteria: selectionCriteria,
        FieldNames: fieldNames,
        ReportName: params.reportName || 'AdsStat_' + Utilities.getUuid().substring(0, 8),
        ReportType: params.reportType || DirectAttrCatalog.REPORT_TYPE,
        DateRangeType: 'CUSTOM_DATE',
        Format: 'TSV',
        IncludeVAT: 'YES',
        IncludeDiscount: 'NO',
        Page: {
          Limit: 1000000,
        },
      },
    };

    if (params.orderByField) {
      body.params.OrderBy = [{ Field: params.orderByField, SortOrder: 'ASCENDING' }];
    }

    return body;
  }

  function fetchReport(params) {
    const token = params.token || getToken_();
    const clientLogin = params.clientLogin != null ? params.clientLogin : getClientLogin_();
    const headers = buildHeaders_(token, clientLogin);
    const body = buildReportBody_(params);
    const tsv = pollReport_(body, headers);
    return parseTsv_(tsv);
  }

  return {
    fetchReport: fetchReport,
    parseTsv: parseTsv_,
  };
})();
