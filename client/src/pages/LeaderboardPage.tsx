import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Search, Medal, TrendingUp } from "lucide-react";

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardFilter, setLeaderboardFilter] = useState("all");
  
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['/api/leaderboard'],
  });
  
  // Filter players based on search query
  const filteredPlayers = leaderboard?.filter((player: any) => 
    player.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Leaderboard - GameZone</title>
        <meta name="description" content="Check out the top players on GameZone. Compete with friends and climb the rankings!" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">Compete with friends and climb the rankings!</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <Tabs defaultValue="global" className="mb-6">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
            <TabsTrigger value="global" onClick={() => setLeaderboardFilter("all")}>Global Rankings</TabsTrigger>
            <TabsTrigger value="friends" onClick={() => setLeaderboardFilter("friends")}>Friends Only</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Leaderboard */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-primary" />
                  Top Players
                </CardTitle>
                <CardDescription>Players ranked by total score across all games</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {Array(10).fill(0).map((_, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 rounded-md animate-pulse">
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                        <div className="w-16 h-8 bg-muted rounded-md"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredPlayers?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="pb-4 pt-2 font-medium">Rank</th>
                          <th className="pb-4 pt-2 font-medium">Player</th>
                          <th className="pb-4 pt-2 font-medium">Total Score</th>
                          <th className="pb-4 pt-2 font-medium">Games</th>
                          <th className="pb-4 pt-2 font-medium">Win Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.map((player: any, index: number) => (
                          <tr key={player.user.id} className="border-b hover:bg-muted/10 transition-colors">
                            <td className="py-4">
                              {index < 3 ? (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  index === 0 ? 'bg-primary text-white' :
                                  index === 1 ? 'bg-secondary text-white' :
                                  'bg-accent text-accent-foreground'
                                }`}>
                                  <Medal className="h-4 w-4" />
                                </div>
                              ) : (
                                <span className="font-medium ml-3">{index + 1}</span>
                              )}
                            </td>
                            <td className="py-4">
                              <Link href={`/profile/${player.user.id}`}>
                                <div className="flex items-center cursor-pointer">
                                  <Avatar className="mr-3 h-8 w-8">
                                    <AvatarImage src={player.user.avatarUrl} />
                                    <AvatarFallback>
                                      {player.user.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{player.user.username}</div>
                                    <div className="text-xs text-muted-foreground">Member since {new Date(player.user.createdAt).toLocaleDateString()}</div>
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td className="py-4 font-medium">{player.totalScore.toLocaleString()}</td>
                            <td className="py-4">{player.gamesPlayed}</td>
                            <td className="py-4">
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Players Found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No players matching "${searchQuery}"`
                        : "Start playing games to appear on the leaderboard!"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Your Rank Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold">?</span>
                  </div>
                  <p className="text-muted-foreground mb-4">Sign in to see your rank</p>
                  <Button className="w-full bg-primary text-white hover:bg-primary/90">
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Rising Stars */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-secondary" />
                  Rising Stars
                </CardTitle>
                <CardDescription>
                  Players who are quickly climbing the ranks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, index) => (
                      <div key={index} className="flex items-center gap-2 animate-pulse">
                        <div className="w-8 h-8 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-2 bg-muted rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard?.slice(-5).reverse().map((player: any) => (
                      <Link key={player.user.id} href={`/profile/${player.user.id}`}>
                        <div className="flex items-center p-2 rounded-md hover:bg-muted/10 transition-colors cursor-pointer">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={player.user.avatarUrl} />
                            <AvatarFallback>
                              {player.user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{player.user.username}</div>
                            <div className="text-xs text-muted-foreground">Score: {player.totalScore.toLocaleString()}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
