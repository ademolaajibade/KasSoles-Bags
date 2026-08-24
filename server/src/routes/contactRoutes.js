const express = require("express");
const { sendContactMessage } = require("../controllers/contactController");
const { contactLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/", contactLimiter, sendContactMessage);

module.exports = router;
