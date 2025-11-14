// js/seriesHelper.js
class SeriesHelper {
  static isSeasonal(series) {
    return Array.isArray(series?.seasons) && series.seasons.length > 0;
  }

  static totalEpisodes(series) {
    if (Array.isArray(series?.segments) && series.segments.length) {
      return series.segments.reduce((sum, s) => {
        const from = Number(s.from) || 1;
        const to = Number(s.to) || from;
        return sum + Math.max(0, to - from + 1);
      }, 0);
    }

    if (this.isSeasonal(series)) {
      return series.seasons.reduce((a, s) => a + (s.episodes || 0), 0);
    }

    return series.episodes || 0;
  }

  static seasonCount(series) {
    if (this.isSeasonal(series)) {
      return series.seasons.length;
    }
    return series.episodes ? 1 : 0;
  }

  static listLanguages(series) {
    const langs = new Set();

    if (!series) return [];

    if (series.lang) {
      langs.add(series.lang);
    }

    if (Array.isArray(series.segments)) {
      series.segments.forEach(seg => {
        if (seg?.lang) langs.add(seg.lang);
      });
    }

    if (this.isSeasonal(series)) {
      series.seasons.forEach(season => {
        if (season?.lang) langs.add(season.lang);
      });
    }

    return Array.from(langs).filter(Boolean);
  }

  static collectHosts(series) {
    const hosts = new Set();
    const pushHost = (url) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        hosts.add(parsed.hostname.replace(/^www\./, ''));
      } catch (err) {
        // ignore invalid URL
      }
    };

    if (Array.isArray(series?.segments)) {
      series.segments.forEach(seg => pushHost(seg?.baseUrl));
    }

    if (this.isSeasonal(series)) {
      series.seasons.forEach(season => pushHost(season?.baseUrl));
    } else if (series?.baseUrl) {
      pushHost(series.baseUrl);
    }

    return Array.from(hosts);
  }

  static guessFormat(series) {
    if (!series) return 'unknown';

    if (typeof series.format === 'string') {
      const fmt = series.format.toLowerCase();
      if (/movie|film/.test(fmt)) return 'movie';
      if (/special|ova/.test(fmt)) return 'special';
      if (/serie|tv|show/.test(fmt)) return 'series';
    }

    const episodes = this.totalEpisodes(series);
    if (episodes <= 1) return 'movie';
    if (episodes > 1) return 'series';
    return 'unknown';
  }

  static seasonFromAbsolute(series, absEp) {
    if (!this.isSeasonal(series)) {
      return { seasonIndex: 0, epInSeason: absEp };
    }

    let left = absEp;
    for (let i = 0; i < series.seasons.length; i++) {
      const n = series.seasons[i].episodes || 0;
      if (left <= n) return { seasonIndex: i, epInSeason: left };
      left -= n;
    }

    const lastIndex = Math.max(0, series.seasons.length - 1);
    return {
      seasonIndex: lastIndex,
      epInSeason: Math.max(1, series.seasons[lastIndex].episodes || 1)
    };
  }

  static buildEpisodeUrl(series, absEp) {
    // Serie con segments (tipo One Piece ITA / SUB-ITA)
    if (Array.isArray(series.segments)) {
      const seg = series.segments.find(s => absEp >= s.from && absEp <= s.to);
      if (seg) {
        const start = (typeof seg.startNumber === 'number') ? seg.startNumber : 1;
        const fileNumber = start + (absEp - seg.from);
        const ep = String(fileNumber).padStart(seg.padLength || 2, '0');
        const lang = (seg.lang || series.lang || '').replace(/\s+/g, '_');
        const prefix = seg.filePrefix || '';
        const base = seg.baseUrl.endsWith('/') ? seg.baseUrl : seg.baseUrl + '/';
        return `${base}${prefix}${ep}_${lang}.mp4`;
      }
    }

    // Stagionale
    if (this.isSeasonal(series)) {
      const { seasonIndex, epInSeason } = this.seasonFromAbsolute(series, absEp);
      return this.buildSeasonEpisodeUrl(series.seasons[seasonIndex], epInSeason);
    }

    // Serie flat
    return this.buildSeasonEpisodeUrl(series, absEp);
  }

  static buildSeasonEpisodeUrl(seasonData, epNum) {
    const padLen = seasonData.padLength || 2;
    const ep = String(epNum).padStart(padLen, '0');
    const lang = (seasonData.lang || '').replace(/\s+/g, '_');
    return `${seasonData.baseUrl}${seasonData.filePrefix}${ep}_${lang}.mp4`;
  }

  static findById(id) {
    return CATALOG.find(s => s.id === id);
  }
}
