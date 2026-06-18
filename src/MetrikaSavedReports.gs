/**
 * @fileoverview Именованные сохранённые отчёты.
 */
const MetrikaSavedReports = (function () {
  const STORAGE_KEY = 'metrika_saved_reports_json';

  function readAll_() {
    MetrikaStorage.ensureStorageReady();
    const raw = MetrikaStorage.readRaw(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      Logger.log('SavedReports parse: ' + e);
      return [];
    }
  }

  function writeAll_(list) {
    MetrikaStorage.writeRaw(STORAGE_KEY, JSON.stringify(list || []));
  }

  function newId_() {
    return Utilities.getUuid();
  }

  function list() {
    return readAll_();
  }

  function getById(id) {
    const items = readAll_();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        return items[i];
      }
    }
    return null;
  }

  function presetLabel_(r) {
    if (r.source === 'direct') {
      return 'Директ';
    }
    const preset = MetrikaPresets.getById(r.presetId);
    if (preset) {
      return preset.label;
    }
    if (r.presetId === 'custom') {
      return 'Произвольный';
    }
    return r.presetId || '';
  }

  function periodText_(r) {
    const slice = presetLabel_(r);
    const range =
      r.dateMode === 'fixed'
        ? (r.date1 || '') + ' - ' + (r.date2 || '')
        : 'последние ' + (r.relativeDays || 30) + ' дн.';
    return slice + ' · ' + range;
  }

  function sourceLabel_(r) {
    return r.source === 'direct' ? 'Директ' : 'Метрика';
  }

  function buildSummary_(r) {
    const subject =
      r.source === 'direct'
        ? 'Директ'
        : r.counterName || r.counterId || 'Метрика';
    return (
      sourceLabel_(r) +
      ' · ' +
      subject +
      ' · ' +
      periodText_(r) +
      (r.targetAnchor ? ' · ' + r.targetAnchor : '')
    );
  }

  function listForUi() {
    return list().map(function (r) {
      return {
        id: r.id,
        name: r.name,
        counterId: r.counterId,
        counterName: r.counterName || '',
        presetId: r.presetId,
        targetAnchor: r.targetAnchor || '',
        autoRefresh: !!r.autoRefresh,
        dateMode: r.dateMode || 'relative',
        relativeDays: r.relativeDays || 30,
        lastRunAt: r.lastRunAt || '',
        lastRunAtDisplay: MetrikaDates.formatLastRunAtDisplay(r.lastRunAt),
        lastRunError: r.lastRunError || '',
        source: r.source === 'direct' ? 'direct' : 'metrika',
        sourceLabel: sourceLabel_(r),
        yandexAccountId: r.yandexAccountId || '',
        yandexLogin: r.yandexLogin || '',
        hasYandexToken: r.yandexAccountId ? YandexAuth.hasTokenForAccount(r.yandexAccountId) : YandexAuth.hasAccess(),
        summary: buildSummary_(r),
        presetLabel: presetLabel_(r),
        periodText: periodText_(r),
      };
    });
  }

  function save(data) {
    const name = String(data.name || '').trim();
    if (!name) {
      throw new Error('Укажите название пресета.');
    }
    const source = data.source === 'direct' ? 'direct' : 'metrika';
    if (source === 'metrika' && !data.counterId) {
      throw new Error('Выберите счётчик.');
    }
    if (source === 'direct') {
      if (!String(data.customMetrics || '').trim()) {
        throw new Error('Добавьте хотя бы одну метрику.');
      }
    }
    if (!data.targetAnchor && !data.sheetName) {
      throw new Error('Укажите ячейку (например A1 или Лист!B3) для выгрузки в таблицу.');
    }

    const items = readAll_();
    const id = data.id || newId_();
    const now = new Date().toISOString();

    const profile = YandexAuth.getActiveAccountProfile();
    if (!profile || !profile.id) {
      throw new Error('Войдите в Яндекс и нажмите «Проверить вход» перед сохранением пресета.');
    }

    const record = {
      id: id,
      name: name,
      source: source,
      yandexAccountId: String(profile.id),
      yandexLogin: String(profile.login || ''),
      counterId: source === 'direct' ? '' : String(data.counterId),
      counterName: source === 'direct' ? '' : String(data.counterName || ''),
      presetId: source === 'direct' ? 'direct' : data.presetId || 'daily',
      customDimensions: data.customDimensions || '',
      customMetrics: data.customMetrics || '',
      directCampaignIds: data.directCampaignIds || '',
      utmFilters: data.utmFilters || null,
      sort: data.sort || 'preset',
      showColumnHeaders: data.showColumnHeaders !== false,
      excludeToday: !!data.excludeToday,
      targetAnchor: String(data.targetAnchor || '').trim(),
      sheetName: String(data.sheetName || '').trim(),
      dateMode: data.dateMode === 'fixed' ? 'fixed' : 'relative',
      relativeDays: Math.max(1, parseInt(data.relativeDays, 10) || 30),
      date1: data.date1 || '',
      date2: data.date2 || '',
      autoRefresh: !!data.autoRefresh,
      updatedAt: now,
      lastRunAt: data.lastRunAt || '',
      lastRunError: data.lastRunError || '',
    };

    var found = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i] = record;
        found = true;
        break;
      }
    }
    if (!found) {
      items.push(record);
    }
    writeAll_(items);
    return { ok: true, id: id, report: record };
  }

  function duplicate(id) {
    const source = getById(id);
    if (!source) {
      throw new Error('Пресет не найден');
    }

    const copy = JSON.parse(JSON.stringify(source));
    copy.id = newId_();
    copy.name = 'Копия ' + (source.name || '');
    copy.updatedAt = new Date().toISOString();
    copy.lastRunAt = '';
    copy.lastRunError = '';

    const items = readAll_();
    items.push(copy);
    writeAll_(items);
    return { ok: true, id: copy.id, report: copy };
  }

  function remove(id) {
    writeAll_(
      readAll_().filter(function (r) {
        return r.id !== id;
      })
    );
    return { ok: true };
  }

  function setAutoRefresh(id, enabled) {
    const items = readAll_();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i].autoRefresh = !!enabled;
        writeAll_(items);
        return { ok: true };
      }
    }
    throw new Error('Пресет не найден');
  }

  function markRun_(id, errorMessage) {
    const items = readAll_();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i].lastRunAt = new Date().toISOString();
        items[i].lastRunError = errorMessage || '';
        writeAll_(items);
        return;
      }
    }
  }

  function toLoadRequest(saved) {
    const dates = MetrikaDates.resolveFromSaved(saved);
    return {
      source: saved.source === 'direct' ? 'direct' : 'metrika',
      counterId: saved.counterId,
      counterName: saved.counterName,
      presetId: saved.presetId,
      date1: dates.date1,
      date2: dates.date2,
      excludeToday: !!saved.excludeToday,
      sheetName: saved.sheetName || '',
      targetAnchor: saved.targetAnchor || '',
      customDimensions: saved.customDimensions || '',
      customMetrics: saved.customMetrics || '',
      directCampaignIds: saved.directCampaignIds || '',
      sort: saved.sort || 'preset',
      utmFilters: saved.utmFilters || null,
      showColumnHeaders: saved.showColumnHeaders !== false,
      dateMode: saved.dateMode,
      relativeDays: saved.relativeDays,
    };
  }

  function runById(id) {
    const saved = getById(id);
    if (!saved) {
      throw new Error('Пресет не найден');
    }
    try {
      const result = YandexAuth.withAccount(saved.yandexAccountId || '', function () {
        if (saved.source === 'direct') {
          return DirectReport.loadAndWrite(toLoadRequest(saved));
        }
        return MetrikaReport.loadAndWrite(toLoadRequest(saved));
      });
      markRun_(id, '');
      return result;
    } catch (e) {
      markRun_(id, String(e.message || e));
      throw e;
    }
  }

  function runBatch_(reports) {
    const summary = { ok: 0, fail: 0, errors: [], total: reports.length };
    reports.forEach(function (r) {
      try {
        runById(r.id);
        summary.ok++;
      } catch (e) {
        summary.fail++;
        summary.errors.push(r.name + ': ' + String(e.message || e));
      }
    });
    return summary;
  }

  return {
    list: list,
    listForUi: listForUi,
    getById: getById,
    save: save,
    duplicate: duplicate,
    remove: remove,
    setAutoRefresh: setAutoRefresh,
    toLoadRequest: toLoadRequest,
    runById: runById,
    runAllSaved: function () {
      return runBatch_(list());
    },
  };
})();
