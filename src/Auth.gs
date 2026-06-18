/**
 * @fileoverview OAuth 2.0: несколько аккаунтов Яндекса (токены в UserProperties).
 */

const YandexAuth = (function () {
  const SERVICE_NAME_LEGACY = 'Yandex';
  const SERVICE_NAME_PENDING = 'YandexPending';
  const AUTH_BASE_URL = 'https://oauth.yandex.ru/authorize';
  const TOKEN_URL = 'https://oauth.yandex.ru/token';
  const USER_INFO_URL = 'https://login.yandex.ru/info?format=json';
  const SCOPES = 'metrika:read direct:api passport:business';
  const KEY_ACTIVE_ACCOUNT = 'yandex_active_account_id';
  const KEY_ACCOUNTS_REGISTRY = 'yandex_accounts_registry_json';

  function ensureConfigured_() {
    if (!YandexConfig.isConfigured()) {
      throw new Error(
        'Не настроены Yandex OAuth credentials. ' +
          'Запустите setupYandexCredentials(clientId, clientSecret) в редакторе Apps Script.'
      );
    }
  }

  function userProps_() {
    return PropertiesService.getUserProperties();
  }

  function oauthStorageKey_(serviceName) {
    return 'oauth2.' + serviceName;
  }

  function accountServiceName_(accountId) {
    return 'YandexAcc_' + String(accountId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function createService_(serviceName) {
    ensureConfigured_();
    return OAuth2.createService(serviceName)
      .setAuthorizationBaseUrl(AUTH_BASE_URL)
      .setTokenUrl(TOKEN_URL)
      .setClientId(YandexConfig.getClientId())
      .setClientSecret(YandexConfig.getClientSecret())
      .setScope(SCOPES)
      .setCallbackFunction('authCallback')
      .setParam('access_type', 'offline')
      .setCache(CacheService.getUserCache())
      .setPropertyStore(userProps_());
  }

  function getPendingService_() {
    return createService_(SERVICE_NAME_PENDING);
  }

  function getLegacyService_() {
    return createService_(SERVICE_NAME_LEGACY);
  }

  function getServiceForAccount_(accountId) {
    return createService_(accountServiceName_(accountId));
  }

  function copyOAuthBetweenServices_(fromName, toName) {
    const props = userProps_();
    const data = props.getProperty(oauthStorageKey_(fromName));
    if (!data) {
      return false;
    }
    props.setProperty(oauthStorageKey_(toName), data);
    props.deleteProperty(oauthStorageKey_(fromName));
    return true;
  }

  function readRegistry_() {
    const raw = userProps_().getProperty(KEY_ACCOUNTS_REGISTRY);
    if (!raw) {
      return [];
    }
    try {
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      Logger.log('YandexAuth registry parse: ' + e);
      return [];
    }
  }

  function writeRegistry_(list) {
    userProps_().setProperty(KEY_ACCOUNTS_REGISTRY, JSON.stringify(list || []));
  }

  function upsertRegistryAccount_(info) {
    const id = String(info.id || '').trim();
    if (!id) {
      return;
    }
    const login = info.login || info.default_email || '';
    const list = readRegistry_();
    const now = new Date().toISOString();
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === id) {
        list[i].login = login || list[i].login || '';
        list[i].email = info.default_email || list[i].email || '';
        list[i].updatedAt = now;
        found = true;
        break;
      }
    }
    if (!found) {
      list.push({
        id: id,
        login: login,
        email: info.default_email || '',
        updatedAt: now,
      });
    }
    writeRegistry_(list);
  }

  function getAccountLogin_(accountId) {
    const id = String(accountId || '').trim();
    if (!id) {
      return '';
    }
    const registry = readRegistry_();
    for (var i = 0; i < registry.length; i++) {
      if (String(registry[i].id) === id) {
        return registry[i].login || registry[i].email || id;
      }
    }
    return id;
  }

  function getActiveAccountId_() {
    return String(userProps_().getProperty(KEY_ACTIVE_ACCOUNT) || '').trim();
  }

  function setActiveAccountId_(accountId) {
    const id = String(accountId || '').trim();
    if (!id) {
      userProps_().deleteProperty(KEY_ACTIVE_ACCOUNT);
      return;
    }
    userProps_().setProperty(KEY_ACTIVE_ACCOUNT, id);
  }

  function fetchUserInfoWithToken_(token) {
    const response = UrlFetchApp.fetch(USER_INFO_URL, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    const body = response.getContentText('utf-8');

    if (code === 401 || code === 403) {
      throw new Error('Токен Яндекса недействителен. Войдите снова.');
    }
    if (code < 200 || code >= 300) {
      throw new Error('Ошибка Яндекс API (' + code + '): ' + body);
    }

    return JSON.parse(body);
  }

  function migrateLegacyIfNeeded_() {
    const legacy = getLegacyService_();
    if (!legacy.hasAccess()) {
      return false;
    }
    try {
      const token = legacy.getAccessToken();
      const info = fetchUserInfoWithToken_(token);
      const accountId = String(info.id || '').trim();
      if (!accountId) {
        return false;
      }
      copyOAuthBetweenServices_(SERVICE_NAME_LEGACY, accountServiceName_(accountId));
      upsertRegistryAccount_(info);
      if (!getActiveAccountId_()) {
        setActiveAccountId_(accountId);
      }
      legacy.reset();
      return true;
    } catch (e) {
      Logger.log('migrateLegacyIfNeeded_: ' + e);
      return false;
    }
  }

  function finalizePendingAuth_() {
    const pending = getPendingService_();
    if (!pending.hasAccess()) {
      return null;
    }
    const token = pending.getAccessToken();
    const info = fetchUserInfoWithToken_(token);
    const accountId = String(info.id || '').trim();
    if (!accountId) {
      throw new Error('Не удалось определить ID аккаунта Яндекса.');
    }
    copyOAuthBetweenServices_(SERVICE_NAME_PENDING, accountServiceName_(accountId));
    upsertRegistryAccount_(info);
    setActiveAccountId_(accountId);
    pending.reset();
    return {
      id: accountId,
      login: info.login || info.default_email || accountId,
      email: info.default_email || '',
    };
  }

  function resolveAccountId_(accountId) {
    migrateLegacyIfNeeded_();
    const explicit = accountId != null && accountId !== '' ? String(accountId).trim() : '';
    if (explicit) {
      return explicit;
    }
    return getActiveAccountId_();
  }

  function hasAccess(accountId) {
    if (!YandexConfig.isConfigured()) {
      return false;
    }
    migrateLegacyIfNeeded_();
    const id = resolveAccountId_(accountId);
    if (!id) {
      return false;
    }
    return getServiceForAccount_(id).hasAccess();
  }

  function getAccessToken(accountId) {
    const id = resolveAccountId_(accountId);
    if (!id) {
      throw new Error('Аккаунт Яндекса не выбран. Войдите в настройках отчёта.');
    }
    return getServiceForAccount_(id).getAccessToken();
  }

  function getAuthorizationUrl() {
    getPendingService_().reset();
    return getPendingService_().getAuthorizationUrl();
  }

  function getAuthorizationUrlForAccountSwitch() {
    getPendingService_().reset();
    return getPendingService_()
      .setParam('force_confirm', 'yes')
      .getAuthorizationUrl();
  }

  function reset(accountId) {
    if (!YandexConfig.isConfigured()) {
      return;
    }
    migrateLegacyIfNeeded_();
    const id =
      accountId != null && accountId !== '' ? String(accountId).trim() : getActiveAccountId_();
    if (id) {
      getServiceForAccount_(id).reset();
      if (getActiveAccountId_() === id) {
        setActiveAccountId_('');
      }
      return;
    }
    getPendingService_().reset();
    getLegacyService_().reset();
    setActiveAccountId_('');
  }

  function withAccount(accountId, fn) {
    const prev = getActiveAccountId_();
    const id = String(accountId || '').trim();
    if (!id) {
      migrateLegacyIfNeeded_();
      return fn();
    }
    setActiveAccountId_(id);
    if (!hasAccess(id)) {
      setActiveAccountId_(prev || '');
      const login = getAccountLogin_(id);
      throw new Error(
        'Нет сохранённого токена для аккаунта «' +
          login +
          '». Войдите через Яндекс под этим аккаунтом (кнопка «Сменить аккаунт») и пересохраните пресет.'
      );
    }
    try {
      return fn();
    } finally {
      setActiveAccountId_(prev || '');
    }
  }

  function getActiveAccountProfile() {
    migrateLegacyIfNeeded_();
    const id = getActiveAccountId_();
    if (!id || !hasAccess(id)) {
      return null;
    }
    const info = fetchUserInfo(id);
    return {
      id: String(info.id || id),
      login: info.login || info.default_email || id,
      email: info.default_email || '',
    };
  }

  function handleCallback(request) {
    const pending = getPendingService_();
    const authorized = pending.handleCallback(request);
    if (authorized) {
      try {
        finalizePendingAuth_();
      } catch (e) {
        Logger.log('handleCallback finalize: ' + e);
        return HtmlService.createHtmlOutput(
          '<html><body style="font-family:sans-serif;padding:24px">' +
            '<h2>Ошибка авторизации</h2>' +
            '<p>' +
            String(e.message || e) +
            '</p>' +
            '</body></html>'
        );
      }
      return HtmlService.createHtmlOutput(
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head>' +
          '<body style="font-family:sans-serif;padding:24px;text-align:center">' +
          '<h2>Авторизация успешна</h2>' +
          '<p>Закройте эту вкладку и в панели дополнения нажмите «Проверить вход».</p>' +
          '</body></html>'
      );
    }
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:sans-serif;padding:24px">' +
        '<h2>Доступ не предоставлен</h2>' +
        '<p>Закройте вкладку и попробуйте снова из дополнения.</p>' +
        '</body></html>'
    );
  }

  function fetchUserInfo(accountId) {
    const token = getAccessToken(accountId);
    return fetchUserInfoWithToken_(token);
  }

  function getRedirectUri() {
    return OAuth2.getRedirectUri();
  }

  function logRedirectUri() {
    Logger.log('Redirect URI для oauth.yandex.ru:');
    Logger.log(getRedirectUri());
  }

  return {
    hasAccess: hasAccess,
    getAccessToken: getAccessToken,
    getAuthorizationUrl: getAuthorizationUrl,
    getAuthorizationUrlForAccountSwitch: getAuthorizationUrlForAccountSwitch,
    getRedirectUri: getRedirectUri,
    reset: reset,
    handleCallback: handleCallback,
    fetchUserInfo: fetchUserInfo,
    logRedirectUri: logRedirectUri,
    withAccount: withAccount,
    getActiveAccountProfile: getActiveAccountProfile,
    getAccountLogin: getAccountLogin_,
    hasTokenForAccount: function (accountId) {
      return hasAccess(accountId);
    },
  };
})();

/** @param {Object} request */
function authCallback(request) {
  return YandexAuth.handleCallback(request);
}

function setupYandexCredentials() {
  YandexConfig.setCredentials('ВАШ_CLIENT_ID', 'ВАШ_CLIENT_SECRET');
}

function logYandexRedirectUri() {
  YandexAuth.logRedirectUri();
}

function resetYandexAuth() {
  YandexAuth.reset();
  Logger.log('Авторизация Яндекса сброшена для активного аккаунта.');
}
