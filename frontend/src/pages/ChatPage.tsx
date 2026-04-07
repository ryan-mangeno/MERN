import { useParams } from 'react-router-dom';
import ChatThreadView from '../components/ChatThreadView';

function ChatPage() {
  const { serverId, channelId, recieverId } = useParams();

  return (
    <ChatThreadView
      serverId={serverId}
      channelId={channelId}
      recieverId={recieverId}
    />
  );
}

export default ChatPage;
