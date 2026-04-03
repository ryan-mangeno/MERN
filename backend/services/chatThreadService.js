const buildCursorQuery = (baseQuery, before) => {
	const scopedQuery = { ...baseQuery };

	if (!before) {
		return { query: scopedQuery, error: '' };
	}

	const beforeDate = new Date(before);
	if (Number.isNaN(beforeDate.getTime())) {
		return { query: scopedQuery, error: 'Invalid before cursor' };
	}

	scopedQuery.createdAt = { $lt: beforeDate };
	return { query: scopedQuery, error: '' };
};

const getCursorPage = async ({ collection, baseQuery, before, limit, offset = 0, useOffset = false }) => {
	const { query, error } = buildCursorQuery(baseQuery, before);
	if (error) {
		return { docs: [], selected: [], nextCursor: null, hasMore: false, error };
	}

	const docs = await collection.find(query)
		.sort({ createdAt: -1 })
		.skip(before || !useOffset ? 0 : offset)
		.limit(limit + 1)
		.toArray();

	const hasMore = docs.length > limit;
	const selected = hasMore ? docs.slice(0, limit) : docs;
	const nextCursor = hasMore && selected.length ? selected[selected.length - 1].createdAt.toISOString() : null;

	return { docs, selected, nextCursor, hasMore, error: '' };
};

const makeConversationKey = (userIdA, userIdB) => {
	return [userIdA.toString(), userIdB.toString()].sort().join(':');
};

const buildMessageScopeQuery = (serverObjId, channelObjId) => {
	const serverIdString = serverObjId.toString();
	const channelIdString = channelObjId.toString();

	return {
		$or: [
			{ serverId: serverObjId, channelId: channelObjId },
			{ serverID: serverObjId, channelID: channelObjId },
			{ serverId: serverIdString, channelId: channelIdString },
			{ serverID: serverIdString, channelID: channelIdString },
		],
	};
};

const buildMessageDocument = ({ serverObjId, channelObjId, userObjId, username, content, attachments }) => {
	return {
		serverId: serverObjId,
		channelId: channelObjId,
		userId: userObjId,
		username,
		message: content.trim(),
		attachments: Array.isArray(attachments) ? attachments : [],
		createdAt: new Date(),
		edited: false,
	};
};

const buildDmMessageDocument = ({ senderObjId, recipientObjId, content }) => {
	return {
		conversationKey: makeConversationKey(senderObjId, recipientObjId),
		senderId: senderObjId,
		recieverId: recipientObjId,
		message: content.trim(),
		createdAt: new Date(),
		edited: false,
	};
};

const buildDmConversationQuery = (userObjId) => {
	return {
		$or: [
			{ senderId: userObjId },
			{ recieverId: userObjId },
			{ senderID: userObjId },
			{ recipientID: userObjId },
		],
	};
};

const buildServerThread = ({ serverId, channelId, channelName = '', serverName = '' }) => {
	return {
		id: `${serverId.toString()}:${channelId.toString()}`,
		kind: 'server',
		serverId: serverId.toString(),
		channelId: channelId.toString(),
		title: channelName,
		subtitle: serverName,
	};
};

const buildDmThread = ({ userId, recipientId, recipientUsername = '', recipientProfilePicture = '' }) => {
	return {
		id: makeConversationKey(userId, recipientId),
		kind: 'dm',
		userId: userId.toString(),
		recieverId: recipientId.toString(),
		title: recipientUsername,
		avatarUrl: recipientProfilePicture,
	};
};

module.exports = {
	getCursorPage,
	buildMessageScopeQuery,
	buildMessageDocument,
	buildDmMessageDocument,
	buildDmConversationQuery,
	buildServerThread,
	buildDmThread,
	makeConversationKey,
};
