const router = require('express').Router();
const express = require('express');
const { createCheckout, handleWebhook, getPlans } = require('../controllers/billing.controller');
const { authenticate } = require('../middleware/auth');

router.get('/plans', authenticate, getPlans);
router.post('/checkout', authenticate, createCheckout);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;