const { getGammaValue } = require('./gamma');

function calculateBeta(x) {
  return x + getGammaValue();
}

module.exports = { calculateBeta };
