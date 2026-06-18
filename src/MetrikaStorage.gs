/**
 * @fileoverview Настройки Метрики для активной таблицы (DocumentProperties).
 */
const MetrikaStorage = (function () {
  const KEY_COUNTER_ID = 'metrika_counter_id';
  const KEY_COUNTER_NAME = 'metrika_counter_name';
  const KEY_LAST_REQUEST = 'metrika_last_request_json';

  function docProps() {
    return PropertiesService.getDocumentProperties();
  }

  function readRaw(key) {
    return String(docProps().getProperty(key) || '');
  }

  function writeRaw(key, value) {
    if (value === '' || value === null || value === undefined) {
      docProps().deleteProperty(key);
      return;
    }
    docProps().setProperty(key, String(value));
  }

  function ensureStorageReady() {}

  function getCounterId() {
    return String(docProps().getProperty(KEY_COUNTER_ID) || '').trim();
  }

  function getCounterName() {
    return String(docProps().getProperty(KEY_COUNTER_NAME) || '').trim();
  }

  function setCounter(counterId, counterName) {
    docProps().setProperties({
      [KEY_COUNTER_ID]: String(counterId || '').trim(),
      [KEY_COUNTER_NAME]: String(counterName || '').trim(),
    });
  }

  function saveLastRequest(request) {
    writeRaw(KEY_LAST_REQUEST, JSON.stringify(request));
  }

  function getLastRequest() {
    const raw = readRaw(KEY_LAST_REQUEST);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  return {
    ensureStorageReady: ensureStorageReady,
    readRaw: readRaw,
    writeRaw: writeRaw,
    getCounterId: getCounterId,
    getCounterName: getCounterName,
    setCounter: setCounter,
    saveLastRequest: saveLastRequest,
    getLastRequest: getLastRequest,
  };
})();
