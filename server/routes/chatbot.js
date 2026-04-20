const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatbotController');

router.post('/', ctrl.chat);
router.get('/suggestions', ctrl.getSuggestions);

module.exports = router;
