/**
 * @fileoverview Пресеты срезов для Reporting API.
 */
const MetrikaPresets = (function () {
  const PRESETS = [
    {
      id: 'daily',
      label: 'По дням',
      description: 'Визиты и метрики по датам; UTM-фильтры — в блоке ниже',
      dimensions: 'ym:s:date',
      metrics:
        'ym:s:visits,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds,ym:s:robotPercentage',
      sort: 'ym:s:date',
    },
  ];

  /** Старые срезы — только для уже сохранённых пресетов и планировщика. */
  const LEGACY_PRESETS = [
    {
      id: 'utm',
      label: 'По меткам',
      description:
        'Разбивка по source, medium, campaign, content; поля с фильтром «точно» в группировку не попадают',
      dimensions: 'ym:s:UTMSource,ym:s:UTMMedium,ym:s:UTMCampaign,ym:s:UTMContent',
      metrics:
        'ym:s:visits,ym:s:users,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds',
      sort: '-ym:s:visits',
    },
    {
      id: 'goals',
      label: 'Цели',
      description: 'Достижения, конверсия и пользователи по каждой цели',
      dimensions: 'ym:s:goal',
      metrics: 'ym:s:goal reaches,ym:s:goal conversionRate,ym:s:goal users',
      sort: '-ym:s:goal reaches',
      usesGoalsApi: true,
    },
  ];

  function listForUi() {
    return PRESETS.map(function (p) {
      return {
        id: p.id,
        label: p.label,
        description: p.description,
        defaultSort: p.sort || '',
      };
    });
  }

  function getById(id) {
    var all = PRESETS.concat(LEGACY_PRESETS);
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        return all[i];
      }
    }
    return null;
  }

  return {
    listForUi: listForUi,
    getById: getById,
  };
})();
