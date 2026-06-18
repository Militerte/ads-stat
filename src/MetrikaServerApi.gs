/**

 * @fileoverview Функции боковой панели Метрики (google.script.run).

 */



function ensureYandexAuth_() {

  if (!YandexConfig.isConfigured()) {

    throw new Error(

      'OAuth Яндекса не настроен. Разработчик должен выполнить setupYandexCredentials().'

    );

  }

  if (!YandexAuth.hasAccess()) {

    throw new Error('Сначала войдите в аккаунт Яндекса в настройках отчёта.');

  }

}



function buildAuthStatusForSidebar_() {

  if (!YandexConfig.isConfigured()) {

    return {

      configured: false,

      authorized: false,

      login: '',

      message: 'OAuth не настроен разработчиком.',

    };

  }



  var login = '';

  var authorized = YandexAuth.hasAccess();



  if (authorized) {

    try {

      const info = YandexAuth.fetchUserInfo();

      login = info.login || info.default_email || info.id || '';

    } catch (e) {

      Logger.log('buildAuthStatusForSidebar_: ' + e);

    }

  }



  return {

    configured: true,

    authorized: authorized,

    login: login,

    message: '',

  };

}



function getYandexAuthStatusForSidebar() {

  return buildAuthStatusForSidebar_();

}



function getYandexSignInUrlForSidebar() {

  return YandexAuth.getAuthorizationUrl();

}



function getYandexSwitchAccountUrlForSidebar() {
  return YandexAuth.getAuthorizationUrlForAccountSwitch();
}



function signOutYandexFromSidebar() {

  YandexAuth.reset();

  return buildAuthStatusForSidebar_();

}



function loadMetrikaEditorDataForSidebar() {

  ensureYandexAuth_();

  return {

    auth: buildAuthStatusForSidebar_(),

    counters: MetrikaApi.listCounters(),

    counterId: MetrikaStorage.getCounterId(),

    counterName: MetrikaStorage.getCounterName(),

  };

}



function saveCounterSelection(counterId, counterName) {

  MetrikaStorage.setCounter(counterId, counterName || '');

  return { ok: true };

}



function buildReportRequestFromPayload_(payload) {

  const dateMode = payload.dateMode === 'fixed' ? 'fixed' : 'relative';

  return {

    counterId: payload.counterId,

    counterName: payload.counterName || '',

    presetId: payload.presetId,

    date1: payload.date1,

    date2: payload.date2,

    dateMode: dateMode,

    relativeDays: payload.relativeDays,

    excludeToday: !!payload.excludeToday,

    sheetName: payload.sheetName || '',

    targetAnchor: payload.targetAnchor || '',

    customDimensions: payload.customDimensions || '',

    customMetrics: payload.customMetrics || '',

    sort: payload.sort || 'preset',

    utmFilters: payload.utmFilters || null,

    showColumnHeaders: payload.showColumnHeaders !== false,

  };

}



function getVisibleSheetNamesForSidebar() {

  try {

    return SpreadsheetApp.getActiveSpreadsheet()

      .getSheets()

      .filter(function (sheet) {

        return !sheet.isSheetHidden();

      })

      .map(function (sheet) {

        return sheet.getName();

      });

  } catch (e) {

    Logger.log('getVisibleSheetNamesForSidebar: ' + e);

    return [];

  }

}



function buildTargetAnchorFromSidebar(sheetName, cellRef) {

  return MetrikaSheetWriter.formatAnchor(sheetName, cellRef);

}



function parseTargetAnchorForSidebar(anchor) {

  return MetrikaSheetWriter.parseAnchorParts(anchor);

}



function getYandexRedirectUriForSidebar() {
  return { redirectUri: YandexAuth.getRedirectUri() };
}



function getSidebarBootstrap() {
  const tz = MetrikaDates.getTimezone();
  const last = MetrikaStorage.getLastRequest();

  return {
    auth: buildAuthStatusForSidebar_(),
    authorized: YandexAuth.hasAccess(),
    counterId: MetrikaStorage.getCounterId(),
    counterName: MetrikaStorage.getCounterName(),
    counters: [],

    attrCatalog: MetrikaAttrCatalog.listForUi(),

    directAttrCatalog: DirectAttrCatalog.listForUi(),

    sortOptions: MetrikaSort.optionsForUi(),

    presets: MetrikaPresets.listForUi(),

    savedReports: MetrikaSavedReports.listForUi(),

    visibleSheets: getVisibleSheetNamesForSidebar(),

    schedule: MetrikaScheduler.statusForUi(),

    defaultDate2: MetrikaDates.todayStr(),

    yesterday: MetrikaDates.yesterdayStr(),

    defaultDate1: Utilities.formatDate(

      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),

      tz,

      'yyyy-MM-dd'

    ),

    excludeToday: !!(last && last.excludeToday),

    sort: (last && last.sort) || 'preset',

    showColumnHeaders: !last || last.showColumnHeaders !== false,

    targetAnchor: (last && last.targetAnchor) || '',

    sheetName: (last && last.sheetName) || '',

    dateMode: (last && last.dateMode) || 'relative',

    relativeDays: (last && last.relativeDays) || 30,

    editingReportId: '',

    yandexRedirectUri: YandexAuth.getRedirectUri(),

  };

}



function fetchCountersForSidebar() {

  ensureYandexAuth_();

  return MetrikaApi.listCounters();

}



function buildDirectReportRequestFromPayload_(payload) {
  const dateMode = payload.dateMode === 'fixed' ? 'fixed' : 'relative';

  return {
    source: 'direct',
    presetId: 'direct',
    date1: payload.date1,
    date2: payload.date2,
    dateMode: dateMode,
    relativeDays: payload.relativeDays,
    excludeToday: !!payload.excludeToday,
    sheetName: payload.sheetName || '',
    targetAnchor: payload.targetAnchor || '',
    customDimensions: payload.customDimensions || '',
    customMetrics: payload.customMetrics || '',
    directCampaignIds: payload.directCampaignIds || '',
    showColumnHeaders: payload.showColumnHeaders !== false,
  };
}



function runReportFromSidebar(payload) {

  ensureYandexAuth_();

  if (payload && payload.source === 'direct') {
    const request = buildDirectReportRequestFromPayload_(payload);
    const result = DirectReport.loadAndWrite(request);
    MetrikaStorage.saveLastRequest(request);
    return formatRunResult_(result);
  }

  const request = buildReportRequestFromPayload_(payload);

  const result = MetrikaReport.loadAndWrite(request);

  MetrikaStorage.saveLastRequest(request);

  return formatRunResult_(result);

}



function formatRunResult_(result) {

  return {

    ok: true,

    rowCount: result.rowCount,

    sampled: result.sampled,

    sheetName: result.sheetName,

    anchor: result.anchor || '',

    writeMode: result.writeMode || '',

  };

}



function saveReportPresetFromSidebar(payload) {

  ensureYandexAuth_();

  const saved = MetrikaSavedReports.save(payload);

  return {

    ok: true,

    id: saved.id,

    savedReports: MetrikaSavedReports.listForUi(),

    message: 'Пресет «' + payload.name + '» сохранён',

  };

}



function deleteReportPresetFromSidebar(id) {

  MetrikaSavedReports.remove(id);

  return {

    ok: true,

    savedReports: MetrikaSavedReports.listForUi(),

    message: 'Пресет удалён',

  };

}



function copyReportPresetFromSidebar(id) {

  const result = MetrikaSavedReports.duplicate(id);

  return {

    ok: true,

    id: result.id,

    report: result.report,

    savedReports: MetrikaSavedReports.listForUi(),

    message: 'Создана копия: «' + result.report.name + '»',

  };

}



function runSavedReportFromSidebar(id) {
  const result = MetrikaSavedReports.runById(id);

  return Object.assign(formatRunResult_(result), {

    savedReports: MetrikaSavedReports.listForUi(),

  });

}



function setSavedReportAutoRefresh(id, enabled) {

  MetrikaSavedReports.setAutoRefresh(id, enabled);

  return {

    ok: true,

    savedReports: MetrikaSavedReports.listForUi(),

  };

}



function getSavedReportForEdit(id) {

  const r = MetrikaSavedReports.getById(id);

  if (!r) {

    throw new Error('Пресет не найден');

  }

  return r;

}



function applyScheduleFromSidebar(payload) {

  ensureYandexAuth_();

  const parsed = MetrikaScheduler.parseTime(payload.time);

  if (!parsed) {

    throw new Error('Укажите время в формате ЧЧ:ММ, например 06:00');

  }

  return MetrikaScheduler.apply({

    enabled: !!payload.enabled,

    time: parsed.time,

  });

}



function runAllScheduledReportsNow() {
  const summary = MetrikaSavedReports.runAllSaved();

  const total = summary.total != null ? summary.total : summary.ok + summary.fail;

  return {

    ok: true,

    summary: summary,

    savedReports: MetrikaSavedReports.listForUi(),

    message:

      'Обновлено пресетов: ' +

      total +

      '. Успешно: ' +

      summary.ok +

      ', ошибок: ' +

      summary.fail +

      (summary.errors.length ? '\n' + summary.errors.join('\n') : ''),

  };

}



function refreshSavedReportsList() {

  return {

    savedReports: MetrikaSavedReports.listForUi(),

    schedule: MetrikaScheduler.statusForUi(),

  };

}



function getMetrikaSidebarBootstrap() {

  return getSidebarBootstrap();

}



function runMetrikaReportFromSidebar(payload) {

  return runReportFromSidebar(payload);

}



function saveMetrikaCounterSelection(counterId, counterName) {

  return saveCounterSelection(counterId, counterName);

}


