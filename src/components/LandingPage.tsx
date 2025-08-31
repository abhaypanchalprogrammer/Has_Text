import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Users, Zap, Copy, Download, Shield } from 'lucide-react';
import heroImage from '@/assets/hero-illustration.jpg';

interface LandingPageProps {
  onJoinRoom: (roomCode: string, displayName: string) => Promise<void>;
  onCreateRoom: (roomName: string, displayName: string) => Promise<void>;
  loading?: boolean;
}

export default function LandingPage({ onJoinRoom, onCreateRoom, loading = false }: LandingPageProps) {
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState('');
  const [createRoomName, setCreateRoomName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleJoinRoom = () => {
    if (joinRoomCode.trim() && joinDisplayName.trim()) {
      onJoinRoom(joinRoomCode.trim(), joinDisplayName.trim());
      setIsJoinOpen(false);
    }
  };

  const handleCreateRoom = () => {
    if (createDisplayName.trim()) {
      onCreateRoom(createRoomName.trim() || 'Untitled Room', createDisplayName.trim());
      setIsCreateOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-primary p-4 rounded-2xl shadow-glow">
              <MessageSquare className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            HasText
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Real-time text sharing with rooms. Create, join, and collaborate instantly—no signups required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg">
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Room</DialogTitle>
                  <DialogDescription>
                    Start a new room for real-time text collaboration
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="create-room-name">Room Name (Optional)</Label>
                    <Input
                      id="create-room-name"
                      placeholder="My Awesome Room"
                      value={createRoomName}
                      onChange={(e) => setCreateRoomName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-display-name">Your Display Name</Label>
                    <Input
                      id="create-display-name"
                      placeholder="John Doe"
                      value={createDisplayName}
                      onChange={(e) => setCreateDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    onClick={handleCreateRoom} 
                    className="w-full"
                    disabled={!createDisplayName.trim()}
                  >
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg">
                  Join Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Existing Room</DialogTitle>
                  <DialogDescription>
                    Enter the room code to join the conversation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="join-room-code">Room Code</Label>
                    <Input
                      id="join-room-code"
                      placeholder="ROOM123"
                      value={joinRoomCode}
                      onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="join-display-name">Your Display Name</Label>
                    <Input
                      id="join-display-name"
                      placeholder="John Doe"
                      value={joinDisplayName}
                      onChange={(e) => setJoinDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    onClick={handleJoinRoom} 
                    className="w-full"
                    disabled={!joinRoomCode.trim() || !joinDisplayName.trim()}
                  >
                    Join Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Hero Image */}
          <div className="max-w-4xl mx-auto">
            <img 
              src={heroImage} 
              alt="Real-time text collaboration illustration" 
              className="w-full h-auto rounded-2xl shadow-elevated"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center border-0 shadow-chat">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Real-Time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Messages appear instantly to all room members without page reloads. See typing indicators and live presence.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-chat">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Collaborative Rooms</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create or join rooms with simple codes. See who's online and collaborate with up to 100 people simultaneously.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-chat">
            <CardHeader>
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Guest Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                No signup required! Join as a guest with just your name, or create an account for saved preferences.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">Powerful Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4">
              <Copy className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Copy All Messages</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Download className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Export as .txt</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <MessageSquare className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Message History</span>
            </div>
            <div className="flex flex-col items-center p-4">
              <Users className="h-8 w-8 text-primary mb-2" />
              <span className="font-medium">Live Member List</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}