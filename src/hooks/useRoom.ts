import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Room {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
  last_seen_at: string;
  is_online: boolean;
  is_typing?: boolean;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  text: string;
  created_at: string;
}

export const useRoom = () => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(() => {
    const saved = localStorage.getItem("hastext-room");
    return saved ? (JSON.parse(saved) as Room) : null;
  });

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    displayName: string;
  } | null>(() => {
    const saved = localStorage.getItem("hastext-user");
    return saved
      ? (JSON.parse(saved) as { id: string; displayName: string })
      : null;
  });

  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const generateRoomCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  // --- CREATE ROOM ---
  const createRoom = async (roomName: string, displayName: string) => {
    const code = generateRoomCode();
    try {
      const { data: room, error } = await supabase
        .from("rooms")
        .insert({ code, name: roomName || `Room ${code}` })
        .select()
        .single();
      if (error) throw error;

      await joinRoom(code, displayName);
      toast({ title: "Room created!", description: `Room code: ${code}` });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // --- JOIN ROOM ---
  const joinRoom = async (roomCode: string, displayName: string) => {
    try {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .single();
      if (roomError || !room) throw new Error("Room not found");

      const userId =
        "user-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

      const { error: memberError } = await supabase
        .from("room_members")
        .insert({
          room_id: room.id,
          user_id: userId,
          display_name: displayName,
          is_online: true,
          is_typing: false,
        });
      if (memberError && (memberError as any).code === "23505") {
        throw new Error("That name is already taken in this room.");
      }

      setCurrentRoom(room);
      setCurrentUser({ id: userId, displayName });
      localStorage.setItem("hastext-room", JSON.stringify(room));
      localStorage.setItem(
        "hastext-user",
        JSON.stringify({ id: userId, displayName })
      );
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // --- LEAVE ROOM ---
  const leaveRoom = async () => {
    if (currentRoom && currentUser) {
      await supabase
        .from("room_members")
        .update({
          is_online: false,
          is_typing: false,
          last_seen_at: new Date().toISOString(),
        })
        .eq("room_id", currentRoom.id)
        .eq("user_id", currentUser.id);
    }
    localStorage.removeItem("hastext-room");
    localStorage.removeItem("hastext-user");
    setCurrentRoom(null);
    setCurrentUser(null);
    setMembers([]);
    setMessages([]);
  };

  // --- SEND MESSAGE ---
  const sendMessage = async (text: string) => {
    if (!currentRoom || !currentUser || !text.trim()) return;
    await supabase.from("messages").insert({
      room_id: currentRoom.id,
      user_id: currentUser.id,
      display_name: currentUser.displayName,
      text: text.trim(),
    });
  };

  // --- DELETE MESSAGE ---
  const deleteMessage = async (id: string) => {
    if (!currentRoom || !currentUser) return;
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id)
      .eq("room_id", currentRoom.id)
      .eq("user_id", currentUser.id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // --- LOAD ---
  const loadMessages = async (roomId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
  };

  const loadMembers = async (roomId: string) => {
    const { data } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("is_online", true);
    setMembers((data as RoomMember[]) || []);
    setTypingUsers(
      (data as RoomMember[])
        ?.filter((m) => m.is_typing && m.user_id !== currentUser?.id)
        .map((m) => m.display_name) || []
    );
  };

  // --- TYPING ---
  const updateTyping = async (isTyping: boolean) => {
    if (!currentRoom || !currentUser) return;
    await supabase
      .from("room_members")
      .update({ is_typing: isTyping } as any)
      .eq("room_id", currentRoom.id)
      .eq("user_id", currentUser.id);
  };

  // --- SUBSCRIPTIONS ---
  useEffect(() => {
    if (!currentRoom) return;
    loadMessages(currentRoom.id);
    loadMembers(currentRoom.id);

    const msgChannel = supabase
      .channel(`messages:${currentRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${currentRoom.id}`,
        },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${currentRoom.id}`,
        },
        (payload) =>
          setMessages((prev) =>
            prev.filter((m) => m.id !== (payload.old as Message).id)
          )
      )
      .subscribe();

    const memChannel = supabase
      .channel(`members:${currentRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${currentRoom.id}`,
        },
        () => loadMembers(currentRoom.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(memChannel);
    };
  }, [currentRoom?.id]);

  return {
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
  };
};
