// js/progress.js
class ProgressManager {
  static storageKey(id) {
    return `vichi_progress_${id}`;
  }

  static load(id) {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey(id)) || '{}');
    } catch {
      return {};
    }
  }

  static save(id, data) {
    localStorage.setItem(this.storageKey(id), JSON.stringify(data || {}));
  }

  static setLastEpisode(id, epNum) {
    const p = this.load(id);
    p.lastEpisode = epNum;
    this.save(id, p);
  }

  static setPosition(id, epNum, time, duration) {
    const p = this.load(id);
    p.positions = p.positions || {};
    p.positions[epNum] = {
      t: time || 0,
      d: duration || p.positions[epNum]?.d || 0,
      ts: Date.now()
    };
    this.save(id, p);
  }

  static clearPosition(id, epNum) {
    const p = this.load(id);
    if (p.positions) {
      delete p.positions[epNum];
      this.save(id, p);
    }
  }

  static markWatched(id, epNum) {
    const p = this.load(id);
    p.watched = p.watched || {};
    p.watched[epNum] = true;
    if (p.positions) delete p.positions[epNum];
    p.lastEpisode = epNum;
    this.save(id, p);
  }

  static isWatched(id, epNum) {
    return !!(this.load(id).watched?.[epNum]);
  }

  static getPosition(id, epNum) {
    return this.load(id).positions?.[epNum] ?? null;
  }

  static getLatestProgressPercent(series) {
    const p = this.load(series.id);
    if (!p?.positions) return 0;
    const entries = Object.values(p.positions);
    if (!entries.length) return 0;
    const latest = entries.sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
    if (!latest?.d) return 0;
    return Math.max(0, Math.min(100, Math.round((latest.t / latest.d) * 100)));
  }
}
