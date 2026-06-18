/**

 * @fileoverview Точка входа дополнения Google Sheets.

 */



const ADDON_TITLE = 'Ads stat';



/**

 * Главная карточка дополнения (homepage trigger).

 * Открывает боковую панель; карточку не показываем, чтобы не мелькало старое оформление.

 *

 * @return {GoogleAppsScript.Card_Service.Card[]}

 */

function onHomepage() {

  openReportsPanel_();

  return [];

}



/**

 * Открыть боковую панель отчётов.

 *

 * @return {GoogleAppsScript.Card_Service.ActionResponse}

 */

function openMetrikaPanel() {

  openReportsPanel_();

  return CardService.newActionResponseBuilder()

    .setNotification(CardService.newNotification().setText(ADDON_TITLE))

    .build();

}



/**

 * @return {GoogleAppsScript.Card_Service.ActionResponse}

 */

function refreshHomeCard() {

  openReportsPanel_();

  return CardService.newActionResponseBuilder().build();

}



function startYandexSignIn() {

  CardService.newAuthorizationException()

    .setAuthorizationUrl(YandexAuth.getAuthorizationUrl())

    .setResourceDisplayName('Яндекс')

    .throwException();

}



function switchYandexAccount() {

  YandexAuth.reset();

  CardService.newAuthorizationException()

    .setAuthorizationUrl(YandexAuth.getAuthorizationUrlForAccountSwitch())

    .setResourceDisplayName('Яндекс')

    .throwException();

}



/**

 * @return {GoogleAppsScript.Card_Service.ActionResponse}

 */

function signOutFromYandex() {

  YandexAuth.reset();

  return refreshHomeCard();

}



/**

 * @return {GoogleAppsScript.Card_Service.ActionResponse}

 */

function checkYandexAuth() {

  return refreshHomeCard();

}



function openReportsPanel_() {

  const html = HtmlService.createHtmlOutputFromFile('MetrikaSidebar')

    .setTitle(ADDON_TITLE)

    .setWidth(420);

  SpreadsheetApp.getUi().showSidebar(html);

}



/**

 * @return {GoogleAppsScript.Card_Service.CardSection}

 */

function buildSetupSection_() {

  return CardService.newCardSection()

    .addWidget(

      CardService.newTextParagraph().setText(

        'OAuth-приложение Яндекса ещё не настроено в этом проекте Apps Script.'

      )

    )

    .addWidget(

      CardService.newTextParagraph().setText(

        'Разработчик должен один раз выполнить в редакторе Apps Script:\n' +

          '1. setupYandexCredentials() — с вашим Client ID и Client Secret\n' +

          '2. logYandexRedirectUri() — скопировать Redirect URI в oauth.yandex.ru'

      )

    );

}


