const express = require('express');
const router = express.Router();

const {
	sendMessage,
	getMessages,
	updateMessage,
	deleteMessage,
	sendDirectMessage,
	getDirectMessages,
	updateDirectMessage,
	deleteDirectMessage,
	getDirectConversations,
} = require('../controllers/chatController');

// POST /api/servers/:serverId/textChannels/:channelId/messages
router.post('/api/servers/:serverId/textChannels/:channelId/messages', sendMessage);

// GET /api/servers/:serverId/textChannels/:channelId/messages
router.get('/api/servers/:serverId/textChannels/:channelId/messages', getMessages);

// PATCH /api/servers/:serverId/textChannels/:channelId/messages/:messageId
router.patch('/api/servers/:serverId/textChannels/:channelId/messages/:messageId', updateMessage);

// DELETE /api/servers/:serverId/textChannels/:channelId/messages/:messageId
router.delete('/api/servers/:serverId/textChannels/:channelId/messages/:messageId', deleteMessage);

// POST /api/chat/dms/:recipientId/messages
router.post('/api/chat/dms/:recipientId/messages', sendDirectMessage);

// GET /api/chat/dms
router.get('/api/chat/dms', getDirectConversations);

// GET /api/chat/dms/:recipientId/messages
router.get('/api/chat/dms/:recipientId/messages', getDirectMessages);

// PATCH /api/chat/dms/:recipientId/messages/:messageId
router.patch('/api/chat/dms/:recipientId/messages/:messageId', updateDirectMessage);

// DELETE /api/chat/dms/:recipientId/messages/:messageId
router.delete('/api/chat/dms/:recipientId/messages/:messageId', deleteDirectMessage);

module.exports = router;
