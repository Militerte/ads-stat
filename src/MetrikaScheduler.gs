/**
 * @fileoverview Ежедневное автообновление сохранённых пресетов.
 */
const MetrikaScheduler = (function () {
  const STORAGE_KEY = 'metrika_schedule_json';
  const HANDLER = 'runScheduledMetrikaReports';
  const SCHEDULE_TZ = 'Europe/Moscow';
  const DEFAULT_TIME = '06:00';

  function pad2_(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function parseTime_(timeStr) {
    const m = String(timeStr || '')
      .trim()
      .match(/^(\d{1,2}):(\d{2})$/);
    if (!m) {
      return null;
    }
    const hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return {
      hour: hour,
      minute: minute,
      time: pad2_(hour) + ':' + pad2_(minute),
    };
  }

  function fromParts_(hour, minute) {
    return parseTime_(pad2_(hour) + ':' + pad2_(minute)) || parseTime_(DEFAULT_TIME);
  }

  function getConfig() {
    const raw = MetrikaStorage.readRaw(STORAGE_KEY);
    if (!raw) {
      return { enabled: false, time: DEFAULT_TIME, hour: 6, minute: 0, timezone: SCHEDULE_TZ };
    }
    try {
      const c = JSON.parse(raw);
      var parsed = c.time ? parseTime_(c.time) : fromParts_(c.hour, c.minute);
      if (!parsed) {
        parsed = parseTime_(DEFAULT_TIME);
      }
      return {
        enabled: !!c.enabled,
        time: parsed.time,
        hour: parsed.hour,
        minute: parsed.minute,
        timezone: SCHEDULE_TZ,
      };
    } catch (e) {
      return { enabled: false, time: DEFAULT_TIME, hour: 6, minute: 0, timezone: SCHEDULE_TZ };
    }
  }

  function saveConfig(config) {
    var parsed = parseTime_(config.time);
    if (!parsed && config.hour != null) {
      parsed = fromParts_(config.hour, config.minute);
    }
    if (!parsed) {
      parsed = parseTime_(DEFAULT_TIME);
    }
    const c = {
      enabled: !!config.enabled,
      time: parsed.time,
      hour: parsed.hour,
      minute: parsed.minute,
      timezone: SCHEDULE_TZ,
    };
    MetrikaStorage.writeRaw(STORAGE_KEY, JSON.stringify(c));
    return c;
  }

  function deleteScheduleTriggers_() {
    ScriptApp.getProjectTriggers().forEach(function (trigger) {
      if (trigger.getHandlerFunction() === HANDLER) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }

  function installTrigger_(hour, minute) {
    deleteScheduleTriggers_();
    ScriptApp.newTrigger(HANDLER)
      .timeBased()
      .atHour(hour)
      .nearMinute(minute)
      .everyDays(1)
      .create();
  }

  function apply(config) {
    const c = saveConfig(config);
    deleteScheduleTriggers_();
    if (c.enabled) {
      installTrigger_(c.hour, c.minute);
    }
    return {
      ok: true,
      enabled: c.enabled,
      time: c.time,
      hour: c.hour,
      minute: c.minute,
      timezone: SCHEDULE_TZ,
      message: c.enabled
        ? 'Ежедневное обновление в ' + c.time + ' (' + SCHEDULE_TZ + ').'
        : 'Ежедневное автообновление отключено.',
    };
  }

  function statusForUi() {
    const c = getConfig();
    const triggers = ScriptApp.getProjectTriggers().filter(function (t) {
      return t.getHandlerFunction() === HANDLER;
    });
    return {
      enabled: c.enabled,
      time: c.time,
      hour: c.hour,
      minute: c.minute,
      timezone: SCHEDULE_TZ,
      triggerNote: triggers.length ? 'триггер установлен' : 'триггер не установлен',
    };
  }

  return {
    apply: apply,
    statusForUi: statusForUi,
    parseTime: parseTime_,
    getConfig: getConfig,
  };
})();

function runScheduledMetrikaReports() {
  const config = MetrikaScheduler.getConfig();
  if (!config.enabled) {
    return;
  }
  MetrikaSavedReports.runAllSaved();
}
