/**
 * @fileoverview Настройки OAuth-приложения Яндекса (Script Properties).
 */

const YandexConfig = (function () {
  const KEY_CLIENT_ID = 'YANDEX_CLIENT_ID';
  const KEY_CLIENT_SECRET = 'YANDEX_CLIENT_SECRET';

  function scriptProps() {
    return PropertiesService.getScriptProperties();
  }

  function getClientId() {
    return String(scriptProps().getProperty(KEY_CLIENT_ID) || '').trim();
  }

  function getClientSecret() {
    return String(scriptProps().getProperty(KEY_CLIENT_SECRET) || '').trim();
  }

  function isConfigured() {
    return Boolean(getClientId() && getClientSecret());
  }

  /**
   * Однократная настройка credentials разработчиком.
   * Запустите из редактора Apps Script с вашими значениями.
   *
   * @param {string} clientId
   * @param {string} clientSecret
   */
  function setCredentials(clientId, clientSecret) {
    const id = String(clientId || '').trim();
    const secret = String(clientSecret || '').trim();
    if (!id || !secret) {
      throw new Error('Укажите Client ID и Client Secret из oauth.yandex.ru');
    }
    scriptProps().setProperties({
      [KEY_CLIENT_ID]: id,
      [KEY_CLIENT_SECRET]: secret,
    });
    Logger.log('Yandex OAuth credentials сохранены.');
  }

  return {
    getClientId: getClientId,
    getClientSecret: getClientSecret,
    isConfigured: isConfigured,
    setCredentials: setCredentials,
  };
})();
