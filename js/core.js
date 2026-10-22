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
  /* Final score of a run: mean of rounds, plus 50 ms per false start in Precision mode. */
  function scoreRun(rounds, mode, falseStarts) {
    if (!rounds.length) return 0;
    return Math.round(mean(rounds)) + (mode === 'precision' ? 50 * (falseStarts || 0) : 0);
  }
  const isAnticipation = ms => ms < 100;
  return { mean, stdDev, level, percentile, scoreRun, isAnticipation };
});
