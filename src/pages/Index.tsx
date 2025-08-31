import LandingPage from '@/components/LandingPage';
import RoomInterface from '@/components/RoomInterface';
import { useRoom } from '@/hooks/useRoom';

const Index = () => {
  const { 
    currentRoom, 
    currentUser, 
    members, 
    messages, 
    loading, 
    createRoom, 
    joinRoom, 
    leaveRoom, 
    sendMessage 
  } = useRoom();

  if (currentRoom && currentUser) {
    return (
      <RoomInterface 
        room={currentRoom}
        currentUser={currentUser}
        members={members}
        messages={messages}
        onLeaveRoom={leaveRoom}
        onSendMessage={sendMessage}
      />
    );
  }

  return (
    <LandingPage 
      onJoinRoom={joinRoom}
      onCreateRoom={createRoom}
      loading={loading}
    />
  );
};

export default Index;
