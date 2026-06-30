/**
 * Auto-calculation functions for MEC dashboard metrics.
 */

function calcAMClosure(target, completed) {
  if (!target || target === 0) return 0;
  return parseFloat(((completed / target) * 100).toFixed(1));
}

function calcAbnormalityClosure(total, closed) {
  if (!total || total === 0) return 0;
  return parseFloat(((closed / total) * 100).toFixed(1));
}

function calcAbnormalityTotal(whiteTags, redTags) {
  return (whiteTags || 0) + (redTags || 0);
}

function calcAvg5S(scores) {
  const valid = scores.filter(s => s !== null && s !== undefined);
  if (valid.length === 0) return 0;
  return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
}

function calcSubmissionPct(submitted, total) {
  if (!total || total === 0) return 0;
  return parseFloat(((submitted / total) * 100).toFixed(1));
}

/**
 * Calculate overall plant score as weighted average.
 * Weights: 5S(15%), AM(15%), Abnormalities(10%), Kaizens(15%),
 *          Lean(10%), ISO(15%), Process(10%), Opportunities(10%)
 */
function calcPlantScore(metrics) {
  const weights = {
    fiveS: 0.15,
    am: 0.15,
    abnormalities: 0.10,
    kaizens: 0.15,
    lean: 0.10,
    iso: 0.15,
    process: 0.10,
    opportunities: 0.10
  };

  // Normalize each metric to 0-100 scale
  const normalized = {
    fiveS: (metrics.avg5S / 5) * 100,
    am: metrics.avgAMClosure || 0,
    abnormalities: metrics.avgAbnormalityClosure || 0,
    kaizens: Math.min(100, (metrics.totalKaizens / 50) * 100), // 50 kaizens = 100%
    lean: metrics.avgLeanCompletion || 0,
    iso: metrics.avgISO || 0,
    process: metrics.avgProcessClosure || 0,
    opportunities: Math.min(100, (metrics.totalOpportunities / 20) * 100)
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (normalized[key] || 0) * weight;
  }

  return parseFloat(score.toFixed(1));
}

module.exports = {
  calcAMClosure,
  calcAbnormalityClosure,
  calcAbnormalityTotal,
  calcAvg5S,
  calcSubmissionPct,
  calcPlantScore
};
