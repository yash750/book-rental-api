const { calculateBeta } = require('./beta');

function computeAlpha(y) {
  return calculateBeta(y) * 2;
}

module.exports = { computeAlpha };
