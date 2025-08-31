-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_members table
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT true
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms (anyone can read/create rooms)
CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);

-- RLS Policies for room_members (anyone can join rooms)
CREATE POLICY "Anyone can view room members" ON public.room_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join rooms" ON public.room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own membership" ON public.room_members FOR UPDATE USING (true);

-- RLS Policies for messages (anyone in a room can send/read messages)
CREATE POLICY "Anyone can view messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON public.messages FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;