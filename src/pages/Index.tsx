import RoomInterface from "@/components/RoomInterface";
import { useRoom } from "@/hooks/useRoom";
import LandingPage from "@/components/LandingPage";

export default function IndexPage() {
  const {
    currentRoom,
    currentUser,
    members,
    messages,
    typingUsers,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    deleteMessage,
    updateTyping,
  } = useRoom();

  if (!currentRoom || !currentUser) {
    return <LandingPage onCreateRoom={createRoom} onJoinRoom={joinRoom} />;
  }

  return (
    <RoomInterface
      room={currentRoom}
      currentUser={currentUser}
      members={members}
      messages={messages}
      typingUsers={typingUsers}
      onLeaveRoom={leaveRoom}
      onSendMessage={sendMessage}
      onDeleteMessage={deleteMessage}
      onUpdateTyping={updateTyping}
    />
  );
}
