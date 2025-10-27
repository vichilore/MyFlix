// js/urlParser.js
class UrlParser {
  static parseAnimeUrl(url) {
    // es: https://srvXX/.../Anime_Ep_001_SUB_ITA.mp4
    const match = url.match(
      /^(https?:\/\/[^/]+\/DDL\/ANIME\/)([^/]+)\/([^_]+)_Ep_([0-9]+)_([A-Z_]+)\.mp4$/i
    );
    if (!match) return null;

    const [, root, folder, prefix, numStr, lang] = match;
    return {
      baseUrl: root + folder + "/",
      filePrefix: prefix + "_Ep_",
      startIndex: parseInt(numStr, 10),
      padLength: numStr.length,
      lang: lang.replace(/_/g, " ")
    };
  }

  static quickAddSeries(url, title, episodes, extra = {}) {
    const info = this.parseAnimeUrl(url);
    if (!info) throw new Error('URL non valido');
    return {
      id: (extra.id || title).replace(/\s+/g, ''),
      title,
      image: extra.image || '',
      lang: info.lang,
      generator: 'auto',
      episodes,
      baseUrl: info.baseUrl,
      filePrefix: info.filePrefix,
      padLength: info.padLength
    };
  }

  static quickAddSeason(url, episodes, title = '', extra = {}) {
    const info = this.parseAnimeUrl(url);
    if (!info) throw new Error('URL non valido');
    return {
      title,
      episodes,
      image: extra.image || '',
      baseUrl: info.baseUrl,
      filePrefix: info.filePrefix,
      lang: info.lang,
      padLength: info.padLength
    };
  }
}
