const asyncHandler = require("express-async-handler");
const { getShippingFee } = require("../config/shippingRates");

// GET /api/shipping/quote?state=Lagos
const getShippingQuote = asyncHandler(async (req, res) => {
  const { state } = req.query;
  if (!state) {
    res.status(400);
    throw new Error("A state is required");
  }

  res.json({ state, shippingFee: getShippingFee(state) });
});

module.exports = { getShippingQuote };
