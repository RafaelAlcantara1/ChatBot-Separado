const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Rota para processar mensagens do chatbot
router.post('/message', chatController.processMessage);

// Rota para obter histórico de mensagens (opcional)
router.get('/history', chatController.getMessageHistory);

module.exports = router;
