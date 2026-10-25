/* ReflexX core: pure scoring helpers (no DOM) so they can be unit-tested. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ReflexCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const stdDev = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  const level = ms => !ms ? '\u2014' : ms < 180 ? 'S' : ms < 220 ? 'A+' : ms < 260 ? 'A' : ms < 300 ? 'B' : ms < 350 ? 'C' : 'D';
  /* Approximate share of people slower than `ms`, assuming N(273, 40). */
  function percentile(ms) {
    const z = (273 - ms) / (40 * Math.SQRT2), t = 1 / (1 + .3275911 * Math.abs(z));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-z * z);
    return Math.round(50 * (1 + (z < 0 ? -y : y)));
  }
  /* Final score of a run: mean of rounds + penalty per false start (Precision = 50 ms, Custom = user value). */
  function scoreRun(rounds, mode, falseStarts, penaltyMs) {
    if (!rounds.length) return 0;
    const p = penaltyMs !== undefined ? penaltyMs : (mode === 'precision' ? 50 : 0);
    return Math.round(mean(rounds)) + p * (falseStarts || 0);
  }
  /* Positive = improving (first half slower than second half), in ms. */
  function trendDelta(s) { if (s.length < 4) return 0; const h = Math.floor(s.length / 2); return Math.round(mean(s.slice(0, h)) - mean(s.slice(-h))); }
  function histogram(v, bin) {
    if (!v.length) return { start: 0, bins: [] };
    const start = Math.floor(Math.min(...v) / bin) * bin, n = Math.floor((Math.max(...v) - start) / bin) + 1, bins = Array(n).fill(0);
    v.forEach(x => bins[Math.floor((x - start) / bin)]++);
    return { start, bins };
  }
  const isAnticipation = ms => ms < 100;
  return { mean, stdDev, level, percentile, scoreRun, isAnticipation, trendDelta, histogram };
});
