const { deltaMultiplier } = require('./delta');

function getGammaValue() {
  return deltaMultiplier() * 5;
}

module.exports = { getGammaValue };
