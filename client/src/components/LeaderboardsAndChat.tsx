import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatTime, getTimeAgo } from "@/lib/utils";

export default function LeaderboardsAndChat() {
  const [chatMessage, setChatMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
  });
  
  const { data: chatMessages, isLoading: chatLoading, refetch: refetchChat } = useQuery({
    queryKey: ['/api/chat'],
  });

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    try {
      // In a real app, userId would come from authentication
      // For this example, we'll use a mock user ID
      await apiRequest('POST', '/api/chat', {
        userId: 1, // Mock user ID (GamerX)
        message: chatMessage
      });
      
      setChatMessage("");
      refetchChat();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <section className="py-12 container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboards Panel */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-2xl">Top Players This Week</h2>
              <Tabs defaultValue="global">
                <TabsList>
                  <TabsTrigger value="global">Global</TabsTrigger>
                  <TabsTrigger value="friends">Friends</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Player</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Games</th>
                    <th className="pb-3 font-medium">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardLoading ? (
                    // Loading skeleton
                    Array(5).fill(0).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3">
                          <div className="h-6 w-6 bg-muted rounded-md animate-pulse"></div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-muted rounded-full mr-3 animate-pulse"></div>
                            <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                        </td>
                        <td className="py-3">
                          <div className="h-4 w-10 bg-muted rounded animate-pulse"></div>
                        </td>
                        <td className="py-3">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    leaderboard?.map((player: any, index: number) => (
                      <tr key={player.user.id} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-md ${
                            index === 0 ? 'bg-primary text-white' :
                            index === 1 ? 'bg-secondary text-white' :
                            index === 2 ? 'bg-accent text-dark' :
                            'bg-muted text-foreground'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link href={`/profile/${player.user.id}`}>
                            <div className="flex items-center cursor-pointer">
                              <Avatar className="mr-3 h-8 w-8">
                                <AvatarImage src={player.user.avatarUrl} />
                                <AvatarFallback>
                                  {player.user.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{player.user.username}</span>
                            </div>
                          </Link>
                        </td>
                        <td className="py-3 font-medium">{player.totalScore.toLocaleString()}</td>
                        <td className="py-3">{player.gamesPlayed}</td>
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="w-20 h-2 bg-muted rounded-full mr-2">
                              <div 
                                className="h-full bg-green-500 rounded-full" 
                                style={{ width: `${player.winRate}%` }}
                              ></div>
                            </div>
                            <span>{player.winRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/leaderboard">
                <Button variant="link" className="text-primary font-medium">
                  View Full Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Chat Panel */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-md h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-bold text-xl">Game Chat</h2>
            </div>
            
            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-grow p-4 overflow-y-auto custom-scrollbar"
              style={{ maxHeight: "350px" }}
            >
              {chatLoading ? (
                // Loading skeleton
                Array(5).fill(0).map((_, index) => (
                  <div key={index} className="flex mb-4">
                    <div className="w-8 h-8 bg-muted rounded-full mr-2 flex-shrink-0 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <div className="h-4 w-16 bg-muted rounded mr-2 animate-pulse"></div>
                        <div className="h-3 w-12 bg-muted rounded animate-pulse"></div>
                      </div>
                      <div className="h-10 bg-muted rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : (
                chatMessages?.map((message: any) => (
                  <div key={message.id} className="flex mb-4 message-animation">
                    <Avatar className="mr-2 h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.user.avatarUrl} />
                      <AvatarFallback>
                        {message.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-sm mr-2">{message.user.username}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatTime(new Date(message.createdAt))}
                        </span>
                      </div>
                      <p className="bg-muted rounded-lg p-2 text-sm">{message.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-grow rounded-r-none"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  className="bg-primary text-white rounded-l-none hover:bg-primary/90"
                  onClick={sendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
