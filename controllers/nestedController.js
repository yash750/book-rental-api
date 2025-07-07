const { computeAlpha } = require('../utils/nested/alpha');

exports.getAlphaValue = (req, res) => {
  const input = parseInt(req.params.input || '0', 10);
  const result = computeAlpha(input);
  res.json({ result });
};
