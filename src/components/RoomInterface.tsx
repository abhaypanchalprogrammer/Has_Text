import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Copy,
  Download,
  Users,
  Settings,
  MoreVertical,
  UserCircle2,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { Room, RoomMember, Message } from "@/hooks/useRoom";

interface RoomInterfaceProps {
  room: Room;
  currentUser: { id: string; displayName: string };
  members: RoomMember[];
  messages: Message[];
  typingUsers: string[];
  onLeaveRoom: () => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
  onUpdateTyping: (isTyping: boolean) => Promise<void>;
}

export default function RoomInterface({
  room,
  currentUser,
  members,
  messages,
  typingUsers,
  onLeaveRoom,
  onSendMessage,
  onDeleteMessage,
  onUpdateTyping,
}: RoomInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // auto scroll
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // typing handler
  useEffect(() => {
    if (!messageText) {
      onUpdateTyping(false);
      return;
    }
    onUpdateTyping(true);
    const timeout = setTimeout(() => onUpdateTyping(false), 1500);
    return () => clearTimeout(timeout);
  }, [messageText]);

  const handleSendMessage = async () => {
    if (messageText.trim()) {
      await onSendMessage(messageText.trim());
      setMessageText("");
      onUpdateTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyAllMessages = () => {
    const allMessages = (messages || [])
      .map(
        (msg) =>
          `[${new Date(msg.created_at).toLocaleTimeString()}] ${
            msg.display_name
          }: ${msg.text}`
      )
      .join("\n");

    navigator.clipboard.writeText(allMessages);
    toast({ title: "Messages copied!", description: "All messages copied." });
  };

  const downloadAsText = () => {
    const allMessages = (messages || [])
      .map(
        (msg) =>
          `[${new Date(msg.created_at).toLocaleTimeString()}] ${
            msg.display_name
          }: ${msg.text}`
      )
      .join("\n");

    const blob = new Blob([allMessages], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hastext-${room.code}-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Download started!", description: "Your chat was saved." });
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-chat z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onLeaveRoom}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{room?.name || "Room"}</h1>
            <p className="text-sm text-muted-foreground">
              Room: {room?.code} • {members.filter((m) => m.is_online).length}{" "}
              online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {members.length}
          </Badge>

          {/* Mobile Members */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Users className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members ({members.length})
                </h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50"
                    >
                      <div className="relative">
                        <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                        <div
                          className={`absolute -bottom-0 -right-0 w-3 h-3 rounded-full border-2 border-card ${
                            member.is_online
                              ? "bg-status-online"
                              : "bg-status-offline"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.display_name}
                          {member.user_id === currentUser.id && " (You)"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.is_online
                            ? "Online"
                            : formatRelativeTime(member.last_seen_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DrawerContent>
          </Drawer>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={copyAllMessages}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All Messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadAsText}>
                <Download className="h-4 w-4 mr-2" />
                Download as .txt
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Room Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4 bg-chat-background pt-[64px] pb-[80px]">
            <div className="space-y-4">
              {(messages || []).map((message) => (
                <div key={message.id} className="flex flex-col gap-1">
                  <div
                    className={`flex ${
                      message.user_id === currentUser.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`relative max-w-[70%] ${
                        message.user_id === currentUser.id
                          ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground"
                          : "bg-chat-bubble-received text-chat-bubble-received-foreground"
                      } rounded-2xl px-4 py-2 shadow-chat`}
                    >
                      {message.user_id !== currentUser.id && (
                        <p className="text-xs font-medium text-primary mb-1">
                          {message.display_name}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.text}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={`text-xs ${
                            message.user_id === currentUser.id
                              ? "text-chat-bubble-sent-foreground/70"
                              : "text-chat-bubble-received-foreground/70"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                        {message.user_id === currentUser.id && (
                          <button
                            onClick={() => onDeleteMessage(message.id)}
                            className="ml-2 text-xs text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-chat-bubble-received text-chat-bubble-received-foreground rounded-2xl px-4 py-2 shadow-chat">
                    <p className="text-sm text-muted-foreground italic">
                      {typingUsers.join(", ")}{" "}
                      {typingUsers.length === 1 ? "is" : "are"} typing...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="fixed bottom-0 left-0 right-0 w-full border-t border-border p-4 bg-card z-20">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                maxLength={4000}
              />
              <Button
                variant="chat"
                size="icon"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Members */}
        <div className="hidden lg:block w-64 border-l border-border bg-card">
          <div className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50"
                >
                  <div className="relative">
                    <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                    <div
                      className={`absolute -bottom-0 -right-0 w-3 h-3 rounded-full border-2 border-card ${
                        member.is_online
                          ? "bg-status-online"
                          : "bg-status-offline"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.display_name}
                      {member.user_id === currentUser.id && " (You)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.is_online
                        ? "Online"
                        : formatRelativeTime(member.last_seen_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
