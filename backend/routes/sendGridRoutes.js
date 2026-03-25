const express = require('express');
const router = express.Router();
const sendGridController = require('../controllers/sendGridController');

// POST /api/sendgrid/send-verification-email
router.post('/send-verification-email', sendGridController.sendVerificationEmail);

// PUT /api/sendgrid/verify/:token
router.put('/verify/:token', sendGridController.verifyEmail);

module.exports = router;
