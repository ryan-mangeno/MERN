const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/tokenMiddleware');

const {
  createServer,
  getServer,
  updateServer,
  deleteServer,
  createTextChannel,
  deleteTextChannel,
} = require('../controllers/serverController');

const {
  joinServer,
  leaveServer,
  getServerMembers,
  updateServerProfile,
  assignRole,
  removeRole,
} = require('../controllers/membershipController');

const {
  createRole,
  updateRole,
  deleteRole,
  getServerRoles,
} = require('../controllers/rolesController');

const {
  createVoiceChannel,
  getVoiceChannels,
  updateVoiceChannel,
  deleteVoiceChannel,
  joinVoiceChannel,
  leaveVoiceChannel,
} = require('../controllers/voiceChannelController');

// server crud
router.post('/', verifyToken, createServer);
router.get('/:serverId', verifyToken, getServer);
router.patch('/:serverId', verifyToken, updateServer);
router.delete('/:serverId', verifyToken, deleteServer);

// text channels
router.post('/:serverId/textChannels', verifyToken, createTextChannel);
router.delete('/:serverId/textChannels/:channelId', verifyToken, deleteTextChannel);

// server membership
router.post('/:serverId/join', verifyToken, joinServer);
router.delete('/:serverId/leave', verifyToken, leaveServer);
router.get('/:serverId/members', getServerMembers);
router.patch('/:serverId/profile/:userId', updateServerProfile);

// server role assignment
router.post('/:serverId/members/:userId/roles/:roleId', assignRole);
router.delete('/:serverId/members/:userId/roles/:roleId', removeRole);

// server roles crud
router.post('/:serverId/roles', createRole);
router.get('/:serverId/roles', getServerRoles);
router.patch('/:serverId/roles/:roleId', updateRole);
router.delete('/:serverId/roles/:roleId', deleteRole);

// voice channels
router.post('/:serverId/voiceChannels', createVoiceChannel);
router.get('/:serverId/voiceChannels', getVoiceChannels);
router.patch('/:serverId/voiceChannels/:channelId', updateVoiceChannel);
router.delete('/:serverId/voiceChannels/:channelId', deleteVoiceChannel);
router.post('/:serverId/voiceChannels/:channelId/join', joinVoiceChannel);
router.delete('/:serverId/voiceChannels/:channelId/leave', leaveVoiceChannel);


module.exports = router;