const express = require("express");
const { getShippingQuote } = require("../controllers/shippingController");

const router = express.Router();

router.get("/quote", getShippingQuote);

module.exports = router;
