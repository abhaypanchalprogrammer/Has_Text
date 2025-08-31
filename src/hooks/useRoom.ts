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
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // ---- Helpers ----
  const generateRoomCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  // robust ID generator with fallback for older browsers
  const makeRandomId = () => {
    try {
      // @ts-ignore - some environments may lack crypto.randomUUID
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        // @ts-ignore
        return crypto.randomUUID();
      }
    } catch {}
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  };

  // persist userId across reloads
  const getOrCreateUserId = () => {
    let id = localStorage.getItem("user_id");
    if (!id) {
      id = `user-${makeRandomId()}`;
      localStorage.setItem("user_id", id);
    }
    return id;
  };

  // ---- Persistence of room & user ----
  useEffect(() => {
    const savedRoom = localStorage.getItem("currentRoom");
    const savedUser = localStorage.getItem("currentUser");
    if (savedRoom) setCurrentRoom(JSON.parse(savedRoom));
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (currentRoom)
      localStorage.setItem("currentRoom", JSON.stringify(currentRoom));
    else localStorage.removeItem("currentRoom");

    if (currentUser)
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("currentUser");
  }, [currentRoom, currentUser]);

  // ---- Create Room (with code retry on collision) ----
  const createRoom = async (roomName: string, displayName: string) => {
    setLoading(true);
    try {
      let attempts = 0;
      let room: Room | null = null;
      let lastErr: any = null;

      while (attempts < 5 && !room) {
        const code = generateRoomCode();
        const { data, error } = await supabase
          .from("rooms")
          .insert({ code, name: roomName || `Room ${code}` })
          .select()
          .single();

        if (!error && data) {
          room = data as Room;

          // immediately join using the returned room (avoid extra lookup)
          await joinRoom(data.code, displayName);
          toast({
            title: "Room created!",
            description: `Room code: ${data.code}`,
          });
          break;
        }

        // if unique violation (23505), retry with new code; else surface error
        if (
          error &&
          (error.code === "23505" ||
            `${error.message}`.toLowerCase().includes("duplicate"))
        ) {
          attempts++;
          lastErr = error;
          continue;
        } else if (error) {
          throw error;
        }
      }

      if (!room) {
        throw lastErr || new Error("Failed to create room. Please try again.");
      }
    } catch (error: any) {
      toast({
        title: "Error creating room",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---- Join Room ----
  const joinRoom = async (roomCode: string, displayName: string) => {
    setLoading(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .single();

      if (roomError || !room) throw new Error("Room not found");

      const userId = getOrCreateUserId();

      // upsert to reuse the same member row for this user_id in this room
      const { error: memberError } = await supabase
        .from("room_members")
        .upsert({
          room_id: room.id,
          user_id: userId,
          display_name: displayName,
          is_online: true,
          last_seen_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      setCurrentRoom(room as Room);
      setCurrentUser({ id: userId, displayName });

      toast({ title: "Joined room!", description: `Welcome to ${room.name}` });
    } catch (error: any) {
      toast({
        title: "Error joining room",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ---- Leave Room ----
  const leaveRoom = async () => {
    if (currentUser && currentRoom) {
      try {
        await supabase
          .from("room_members")
          .update({ is_online: false, last_seen_at: new Date().toISOString() })
          .eq("room_id", currentRoom.id)
          .eq("user_id", currentUser.id);
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    }
    setCurrentRoom(null);
    setCurrentUser(null);
    setMembers([]);
    setMessages([]);
    localStorage.removeItem("currentRoom");
    localStorage.removeItem("currentUser");
  };

  // ---- Send Message ----
  const sendMessage = async (text: string) => {
    if (!currentRoom || !currentUser || !text.trim()) return;
    try {
      const { error } = await supabase.from("messages").insert({
        room_id: currentRoom.id,
        user_id: currentUser.id,
        display_name: currentUser.displayName,
        text: text.trim(),
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  // ---- Loaders ----
  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadMembers = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error loading members:", error);
    }
  };

  // ---- Presence heartbeat ----
  const updatePresence = async () => {
    if (!currentRoom || !currentUser) return;
    try {
      await supabase
        .from("room_members")
        .update({ last_seen_at: new Date().toISOString(), is_online: true })
        .eq("room_id", currentRoom.id)
        .eq("user_id", currentUser.id);
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  };

  // mark offline on tab close/reload
  useEffect(() => {
    const handleUnload = async () => {
      if (currentRoom && currentUser) {
        try {
          await supabase
            .from("room_members")
            .update({
              is_online: false,
              last_seen_at: new Date().toISOString(),
            })
            .eq("room_id", currentRoom.id)
            .eq("user_id", currentUser.id);
        } catch {}
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [currentRoom, currentUser]);

  // ---- Realtime subscriptions ----
  useEffect(() => {
    if (!currentRoom) return;

    loadMessages(currentRoom.id);
    loadMembers(currentRoom.id);

    const messagesChannel = supabase
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
      .subscribe();

    const membersChannel = supabase
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

    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
      clearInterval(presenceInterval);
    };
  }, [currentRoom, currentUser]);

  return {
    currentRoom,
    currentUser,
    members,
    messages,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
  };
};
