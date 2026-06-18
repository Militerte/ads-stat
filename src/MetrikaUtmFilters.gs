/**
 * @fileoverview Сборка параметра filters для UTM-меток (Reporting API).
 */
const MetrikaUtmFilters = (function () {
  const FIELDS = {
    source: { dim: 'ym:s:UTMSource', label: 'utm_source' },
    medium: { dim: 'ym:s:UTMMedium', label: 'utm_medium' },
    campaign: { dim: 'ym:s:UTMCampaign', label: 'utm_campaign' },
    content: { dim: 'ym:s:UTMContent', label: 'utm_content' },
  };

  const MATCH_OPS = {
    exact: '==',
    contains: '=@',
    not: '!=',
  };

  function escapeValue(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function buildFieldCondition(dimension, value, match) {
    const op = MATCH_OPS[match] || MATCH_OPS.exact;
    const parts = String(value)
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    if (!parts.length) {
      return '';
    }

    const conditions = parts.map(function (part) {
      return dimension + op + "'" + escapeValue(part) + "'";
    });

    return conditions.length === 1 ? conditions[0] : '(' + conditions.join(' OR ') + ')';
  }

  function build(utmFilters, presetFilters) {
    const parts = [];

    if (presetFilters && String(presetFilters).trim()) {
      parts.push('(' + String(presetFilters).trim() + ')');
    }

    if (utmFilters) {
      Object.keys(FIELDS).forEach(function (key) {
        const cfg = utmFilters[key];
        if (!cfg || !cfg.value) {
          return;
        }
        const cond = buildFieldCondition(FIELDS[key].dim, cfg.value, cfg.match || 'exact');
        if (cond) {
          parts.push(cond);
        }
      });

      if (utmFilters.rawExtra && String(utmFilters.rawExtra).trim()) {
        parts.push('(' + String(utmFilters.rawExtra).trim() + ')');
      }
    }

    if (!parts.length) {
      return undefined;
    }
    return parts.join(' AND ');
  }

  function hasAny(utmFilters) {
    if (!utmFilters) {
      return false;
    }
    for (var key in FIELDS) {
      if (utmFilters[key] && String(utmFilters[key].value || '').trim()) {
        return true;
      }
    }
    return !!(utmFilters.rawExtra && String(utmFilters.rawExtra).trim());
  }

  function fieldKeyByDim_(dimensionId) {
    for (var key in FIELDS) {
      if (FIELDS[key].dim === dimensionId) {
        return key;
      }
    }
    return null;
  }

  function isPinnedByExactFilter_(utmFilters, fieldKey) {
    if (!utmFilters || !fieldKey) {
      return false;
    }
    const cfg = utmFilters[fieldKey];
    if (!cfg || !String(cfg.value || '').trim()) {
      return false;
    }
    if ((cfg.match || 'exact') !== 'exact') {
      return false;
    }
    const values = String(cfg.value)
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    return values.length === 1;
  }

  function adjustPresetDimensions(dimensionsCsv, utmFilters) {
    const dims = String(dimensionsCsv || '')
      .split(',')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    const kept = dims.filter(function (dim) {
      const key = fieldKeyByDim_(dim);
      if (!key) {
        return true;
      }
      return !isPinnedByExactFilter_(utmFilters, key);
    });

    return kept.length ? kept.join(',') : undefined;
  }

  return {
    build: build,
    hasAny: hasAny,
    adjustPresetDimensions: adjustPresetDimensions,
  };
})();

function previewUtmFilters(utmFilters, presetId) {
  const preset = MetrikaPresets.getById(presetId);
  const presetFilters = preset && preset.filters ? preset.filters : '';
  return {
    expression: MetrikaUtmFilters.build(utmFilters, presetFilters) || '',
  };
}
