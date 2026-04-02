const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const url = process.env.MONGODB_URI;
const client = new MongoClient(url);

if (!client.topology || !client.topology.isConnected()) {
	client.connect();
}

let indexesReady = false;

const normalizeLimit = (value, fallback = 50) => {
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed <= 0) {
		return fallback;
	}
	return Math.min(parsed, 100);
};

const getBodyUserId = (req) => {
	const { userId } = req.body || {};
	return userId || null;
};

const getRequestUserId = (req) => {
	const bodyUserId = getBodyUserId(req);
	if (bodyUserId) {
		return bodyUserId;
	}

	const authHeader = req.headers.authorization || '';
	if (authHeader.startsWith('Bearer ')) {
		const token = authHeader.slice(7);
		try {
			const payload = jwt.verify(token, process.env.JWT_SECRET);
			return payload.userId || null;
		} catch (e) {
			return null;
		}
	}

	return null;
};

const ensureIndexes = async (db) => {
	if (indexesReady) {
		return;
	}

	await Promise.all([
		db.collection('messages').createIndex({ serverID: 1, channelID: 1, createdAt: -1 }),
		db.collection('directMessages').createIndex({ conversationKey: 1, createdAt: -1 }),
		db.collection('directMessages').createIndex({ participantIDs: 1, createdAt: -1 }),
	]);

	indexesReady = true;
};

const findServerAndChannel = async (db, serverId, channelId) => {
	const serverObjId = new ObjectId(serverId);
	const channelObjId = new ObjectId(channelId);

	const server = await db.collection('servers').findOne({ _id: serverObjId });
	if (!server) {
		return { error: 'Server not found', server: null, channel: null };
	}

	const channel = (server.textChannels || []).find((item) => {
		if (!item || !item.channelID) {
			return false;
		}
		return item.channelID.toString() === channelObjId.toString();
	});

	if (!channel) {
		return { error: 'Channel not found', server, channel: null };
	}

	return { error: '', server, channel };
};

const userHasServerAccess = (server, userObjId) => {
	if (!server) {
		return false;
	}

	const userIdString = userObjId.toString();
	const inMembers = (server.members || []).some((memberId) => String(memberId) === userIdString);

	return inMembers;
};

const getServerProfileForUser = async (db, server, userObjId) => {
	const embeddedProfile = (server.serverProfiles || []).find((profile) => {
		return profile && profile.userId && profile.userId.toString() === userObjId.toString();
	});

	return embeddedProfile || null;
};

const buildSenderProfile = (user, serverProfile) => {
	const serverSpecificName = serverProfile?.serverSpecificName || serverProfile?.nickname || user.username;
	const serverSpecificPFP = serverProfile?.serverSpecificPFP || serverProfile?.profilePicture || user.profilePicture || '';
	const arrayOfServerRoles = serverProfile?.arrayOfServerRoles || serverProfile?.roleIDs || [];

	return {
		userId: user._id,
		username: user.username,
		profilePicture: user.profilePicture || '',
		serverSpecificName,
		serverSpecificPFP,
		arrayOfServerRoles,
	};
};

const decorateServerMessage = (messageDoc, senderProfile) => {
	return {
		...messageDoc,
		sender: senderProfile,
	};
};

const buildMessageDocument = ({ serverObjId, channelObjId, userObjId, username, content, attachments }) => {
	return {
		serverID: serverObjId,
		channelID: channelObjId,
		userId: userObjId,
		username,
		message: content.trim(),
		attachments: Array.isArray(attachments) ? attachments : [],
		createdAt: new Date(),
		edited: false,
	};
};

const sendMessage = async (req, res) => {
	const { serverId, channelId } = req.params;
	const { content, message, attachments = [] } = req.body;
	const bodyContent = content || message;
	const userId = getRequestUserId(req);

	if (!ObjectId.isValid(serverId) || !ObjectId.isValid(channelId)) {
		return res.status(400).json({ message: null, error: 'Invalid server or channel ID' });
	}

	if (!userId || !ObjectId.isValid(userId)) {
		return res.status(401).json({ message: null, error: 'Valid userId is required' });
	}

	if (!bodyContent || !bodyContent.trim()) {
		return res.status(400).json({ message: null, error: 'content is required' });
	}

	try {
		const db = client.db('discord_clone');
		await ensureIndexes(db);

		const { error, server, channel } = await findServerAndChannel(db, serverId, channelId);
		if (error) {
			return res.status(404).json({ message: null, error });
		}

		const userObjId = new ObjectId(userId);
		if (!userHasServerAccess(server, userObjId)) {
			return res.status(403).json({ message: null, error: 'User is not a member of this server' });
		}

		const user = await db.collection('users').findOne({ _id: userObjId });
		if (!user) {
			return res.status(404).json({ message: null, error: 'User not found' });
		}

		const serverProfile = await getServerProfileForUser(db, server, userObjId);
		const senderProfile = buildSenderProfile(user, serverProfile);

		const messageDoc = buildMessageDocument({
			serverObjId: server._id,
			channelObjId: channel.channelID,
			userObjId,
			username: senderProfile.serverSpecificName,
			content: bodyContent,
			attachments,
		});

		messageDoc.sender = senderProfile;
		messageDoc.serverProfile = serverProfile || null;

		const result = await db.collection('messages').insertOne(messageDoc);

		return res.status(201).json({
			message: decorateServerMessage({ ...messageDoc, _id: result.insertedId }, senderProfile),
			error: '',
		});
	} catch (e) {
		return res.status(500).json({ message: null, error: e.toString() });
	}
};

const getMessages = async (req, res) => {
	const { serverId, channelId } = req.params;
	const limit = normalizeLimit(req.query.limit, 50);
	const offset = Math.max(parseInt(req.query.offset || '0', 10) || 0, 0);
	const before = req.query.before;
	const userId = getRequestUserId(req);

	if (!ObjectId.isValid(serverId) || !ObjectId.isValid(channelId)) {
		return res.status(400).json({ messages: [], error: 'Invalid server or channel ID' });
	}

	if (!userId || !ObjectId.isValid(userId)) {
		return res.status(401).json({ messages: [], error: 'Valid userId is required' });
	}

	try {
		const db = client.db('discord_clone');
		await ensureIndexes(db);

		const { error, server, channel } = await findServerAndChannel(db, serverId, channelId);
		if (error) {
			return res.status(404).json({ messages: [], error });
		}

		const userObjId = new ObjectId(userId);
		if (!userHasServerAccess(server, userObjId)) {
			return res.status(403).json({ messages: [], error: 'User is not a member of this server' });
		}

		const query = {
			serverID: server._id,
			channelID: channel.channelID,
		};

		if (before) {
			const beforeDate = new Date(before);
			if (Number.isNaN(beforeDate.getTime())) {
				return res.status(400).json({ messages: [], error: 'Invalid before cursor' });
			}
			query.createdAt = { $lt: beforeDate };
		}

		const docs = await db.collection('messages')
			.find(query)
			.sort({ createdAt: -1 })
			.skip(before ? 0 : offset)
			.limit(limit + 1)
			.toArray();

		const messagesWithProfiles = await Promise.all(docs.map(async (messageDoc) => {
			const messageUserId = messageDoc.userId;
			const messageUserObjId = messageUserId instanceof ObjectId ? messageUserId : new ObjectId(messageUserId);
			const messageUser = await db.collection('users').findOne({ _id: messageUserObjId });
			const messageServerProfile = await getServerProfileForUser(db, server, messageUserObjId);
			const senderProfile = messageUser ? buildSenderProfile(messageUser, messageServerProfile) : null;

			return decorateServerMessage({
				...messageDoc,
				sender: senderProfile,
			}, senderProfile);
		}));

		const hasMore = docs.length > limit;
		const selected = hasMore ? messagesWithProfiles.slice(0, limit) : messagesWithProfiles;
		const nextCursor = hasMore && selected.length ? selected[selected.length - 1].createdAt.toISOString() : null;

		return res.status(200).json({
			messages: selected.reverse(),
			nextCursor,
			error: '',
		});
	} catch (e) {
		return res.status(500).json({ messages: [], error: e.toString() });
	}
};

const updateMessage = async (req, res) => {
	const { serverId, channelId, messageId } = req.params;
	const { content, message } = req.body;
	const bodyContent = content || message;
	const userId = getRequestUserId(req);

	if (!ObjectId.isValid(serverId) || !ObjectId.isValid(channelId) || !ObjectId.isValid(messageId)) {
		return res.status(400).json({ message: null, error: 'Invalid server, channel, or message ID' });
	}

	if (!userId || !ObjectId.isValid(userId)) {
		return res.status(401).json({ message: null, error: 'Valid userId is required' });
	}

	if (!bodyContent || !bodyContent.trim()) {
		return res.status(400).json({ message: null, error: 'content is required' });
	}

	try {
		const db = client.db('discord_clone');
		await ensureIndexes(db);

		const { error, server, channel } = await findServerAndChannel(db, serverId, channelId);
		if (error) {
			return res.status(404).json({ message: null, error });
		}

		const userObjId = new ObjectId(userId);
		if (!userHasServerAccess(server, userObjId)) {
			return res.status(403).json({ message: null, error: 'User is not a member of this server' });
		}

		const messageObjId = new ObjectId(messageId);
		const existingMessage = await db.collection('messages').findOne({
			_id: messageObjId,
			serverID: server._id,
			channelID: channel.channelID,
			userId: userObjId,
		});

		if (!existingMessage) {
			return res.status(404).json({ message: null, error: 'Message not found' });
		}

		const updatedMessage = await db.collection('messages').findOneAndUpdate(
			{ _id: messageObjId },
			{
				$set: {
					message: bodyContent.trim(),
					edited: true,
					editedAt: new Date(),
				},
			},
			{ returnDocument: 'after' }
		);

		return res.status(200).json({ message: updatedMessage.value, error: '' });
	} catch (e) {
		return res.status(500).json({ message: null, error: e.toString() });
	}
};

const deleteMessage = async (req, res) => {
	const { serverId, channelId, messageId } = req.params;
	const userId = getRequestUserId(req);

	if (!ObjectId.isValid(serverId) || !ObjectId.isValid(channelId) || !ObjectId.isValid(messageId)) {
		return res.status(400).json({ message: null, error: 'Invalid server, channel, or message ID' });
	}

	if (!userId || !ObjectId.isValid(userId)) {
		return res.status(401).json({ message: null, error: 'Valid userId is required' });
	}

	try {
		const db = client.db('discord_clone');
		await ensureIndexes(db);

		const { error, server, channel } = await findServerAndChannel(db, serverId, channelId);
		if (error) {
			return res.status(404).json({ message: null, error });
		}

		const userObjId = new ObjectId(userId);
		if (!userHasServerAccess(server, userObjId)) {
			return res.status(403).json({ message: null, error: 'User is not a member of this server' });
		}

		const messageObjId = new ObjectId(messageId);
		const existingMessage = await db.collection('messages').findOne({
			_id: messageObjId,
			serverID: server._id,
			channelID: channel.channelID,
			userId: userObjId,
		});

		if (!existingMessage) {
			return res.status(404).json({ message: null, error: 'Message not found' });
		}

		await db.collection('messages').deleteOne({ _id: messageObjId });

		return res.status(200).json({ message: 'Message deleted successfully', error: '' });
	} catch (e) {
		return res.status(500).json({ message: null, error: e.toString() });
	}
};

const makeConversationKey = (userIdA, userIdB) => {
	return [userIdA.toString(), userIdB.toString()].sort().join(':');
};

const sendDirectMessage = async (req, res) => {
	const { recipientId } = req.params;
	const { content, message } = req.body;
	const bodyContent = content || message;
	const userId = getRequestUserId(req);

	if (!ObjectId.isValid(recipientId)) {
		return res.status(400).json({ message: null, error: 'Invalid recipient ID' });
	}

	if (!userId || !ObjectId.isValid(userId)) {
		return res.status(401).json({ message: null, error: 'Valid userId is required' });
	}

	if (!bodyContent || !bodyContent.trim()) {
		return res.status(400).json({ message: null, error: 'content is required' });
	}

	if (userId === recipientId) {
		return res.status(400).json({ message: null, error: 'Cannot send a message to yourself' });
	}

	try {
		const db = client.db('discord_clone');
		await ensureIndexes(db);

		const senderObjId = new ObjectId(userId);
		const recipientObjId = new ObjectId(recipientId);

		const [sender, recipient] = await Promise.all([
			db.collection('users').findOne({ _id: senderObjId }),
			db.collection('users').findOne({ _id: recipientObjId }),
		]);

		if (!sender || !recipient) {
			return res.status(404).json({ message: null, error: 'Sender or recipient user was not found' });
		}

		const directMessageDoc = {
			conversationKey: makeConversationKey(senderObjId, recipientObjId),
			participantIDs: [senderObjId, recipientObjId],
			senderID: senderObjId,
			recipientID: recipientObjId,
			message: bodyContent.trim(),
			createdAt: new Date(),
			edited: false,
		};

		const result = await db.collection('directMessages').insertOne(directMessageDoc);

		return res.status(201).json({
			message: { ...directMessageDoc, _id: result.insertedId },
			error: '',
		});
	} catch (e) {
		return res.status(500).json({ message: null, error: e.toString() });
	}
};

const getDirectMessages = async (req, res) => {
	const { recipientId } = req.params;
	const limit = normalizeLimit(req.query.limit, 50);
	const before = req.query.before;
	const userId = getRequestUserId(req);

	if (!ObjectId.isValid(recipientId)) {
		return res.status(400).json({ messages: [], error: 'Invalid recipient ID' });
	}

	if (!userId || !ObjectId.isValid(userId)) {
		return res.status(401).json({ messages: [], error: 'Valid userId is required' });
	}

	try {
		const db = client.db('discord_clone');
		await ensureIndexes(db);

		const senderObjId = new ObjectId(userId);
		const recipientObjId = new ObjectId(recipientId);

		const query = {
			conversationKey: makeConversationKey(senderObjId, recipientObjId),
		};

		if (before) {
			const beforeDate = new Date(before);
			if (Number.isNaN(beforeDate.getTime())) {
				return res.status(400).json({ messages: [], error: 'Invalid before cursor' });
			}
			query.createdAt = { $lt: beforeDate };
		}

		const docs = await db.collection('directMessages')
			.find(query)
			.sort({ createdAt: -1 })
			.limit(limit + 1)
			.toArray();

		const hasMore = docs.length > limit;
		const selected = hasMore ? docs.slice(0, limit) : docs;
		const nextCursor = hasMore && selected.length ? selected[selected.length - 1].createdAt.toISOString() : null;

		return res.status(200).json({
			messages: selected.reverse(),
			nextCursor,
			error: '',
		});
	} catch (e) {
		return res.status(500).json({ messages: [], error: e.toString() });
	}
};

const getDirectConversations = async (req, res) => {
	const userId = getRequestUserId(req);

	if (!userId || !ObjectId.isValid(userId)) {
		return res.status(401).json({ conversations: [], error: 'Valid userId is required' });
	}

	try {
		const db = client.db('discord_clone');
		await ensureIndexes(db);

		const userObjId = new ObjectId(userId);
		const conversations = await db.collection('directMessages').aggregate([
			{ $match: { participantIDs: userObjId } },
			{ $sort: { createdAt: -1 } },
			{
				$group: {
					_id: '$conversationKey',
					participantIDs: { $first: '$participantIDs' },
					lastMessage: { $first: '$message' },
					updatedAt: { $first: '$createdAt' },
				},
			},
			{ $sort: { updatedAt: -1 } },
		]).toArray();

		return res.status(200).json({ conversations, error: '' });
	} catch (e) {
		return res.status(500).json({ conversations: [], error: e.toString() });
	}
};

module.exports = {
	sendMessage,
	getMessages,
	updateMessage,
	deleteMessage,
	sendDirectMessage,
	getDirectMessages,
	getDirectConversations,
};
