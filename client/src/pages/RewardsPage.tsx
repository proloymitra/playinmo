import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Star, Crown, Medal, Zap, Check, Gift, Coins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface Reward {
  id: number;
  name: string;
  description: string;
  type: string;
  value: any;
  cost: number;
  category: string;
  rarity: string;
  isActive: boolean;
}

interface UserReward {
  id: number;
  userId: string;
  rewardId: number;
  unlockedAt: string;
  isEquipped: boolean;
  reward: Reward;
}

interface UserPoints {
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
}

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  // Fetch all rewards
  const { data: allRewards, isLoading: rewardsLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  // Fetch user rewards
  const { data: userRewards, isLoading: userRewardsLoading } = useQuery<UserReward[]>({
    queryKey: ['/api/user/rewards'],
  });

  // Fetch user points
  const { data: userPoints, isLoading: pointsLoading } = useQuery<UserPoints>({
    queryKey: ['/api/user/points'],
  });

  // Purchase reward mutation
  const purchaseRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await fetch(`/api/user/rewards/${rewardId}/purchase`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to purchase reward');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reward purchased!',
        description: 'The reward has been added to your collection.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/points'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Purchase failed',
        description: error.message,
      });
    },
  });

  // Equip reward mutation
  const equipRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await fetch(`/api/user/rewards/${rewardId}/equip`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to equip reward');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reward equipped!',
        description: 'The reward is now active.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/rewards'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to equip reward',
        description: error.message,
      });
    },
  });

  // Unequip reward mutation
  const unequipRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await fetch(`/api/user/rewards/${rewardId}/unequip`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to unequip reward');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Reward unequipped',
        description: 'The reward is no longer active.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/rewards'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to unequip reward',
        description: error.message,
      });
    },
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'common': return 'bg-gradient-to-r from-gray-400 to-gray-600';
      default: return 'bg-gray-500';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'epic': return <Star className="h-4 w-4 text-purple-400" />;
      case 'rare': return <Medal className="h-4 w-4 text-blue-400" />;
      case 'common': return <Zap className="h-4 w-4 text-gray-400" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return '🏷️';
      case 'badge': return '🏅';
      case 'avatar_frame': return '🖼️';
      case 'special_feature': return '⚡';
      default: return '🎁';
    }
  };

  // Check if user owns a reward
  const isOwned = (rewardId: number) => {
    return userRewards?.some(ur => ur.rewardId === rewardId);
  };

  // Check if reward is equipped
  const isEquipped = (rewardId: number) => {
    return userRewards?.some(ur => ur.rewardId === rewardId && ur.isEquipped);
  };

  // Combine rewards with user ownership status
  const rewardsWithStatus = allRewards?.map(reward => {
    const owned = isOwned(reward.id);
    const equipped = isEquipped(reward.id);
    return {
      ...reward,
      owned,
      equipped,
      canAfford: (userPoints?.availablePoints || 0) >= reward.cost
    };
  }) || [];

  // Filter rewards by category
  const filteredRewards = rewardsWithStatus.filter(reward => {
    if (activeTab === 'all') return true;
    if (activeTab === 'owned') return reward.owned;
    if (activeTab === 'affordable') return reward.canAfford && !reward.owned;
    return reward.category === activeTab;
  });

  // Get unique categories
  const categories = [...new Set(allRewards?.map(r => r.category) || [])];

  const ownedCount = userRewards?.length || 0;
  const totalCount = allRewards?.length || 0;

  if (rewardsLoading || userRewardsLoading || pointsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Points</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userPoints?.availablePoints || 0}</div>
            <p className="text-xs text-muted-foreground">
              {userPoints?.totalPoints || 0} total earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owned Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownedCount}/{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((ownedCount / totalCount) * 100)}% collection complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipped</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userRewards?.filter(ur => ur.isEquipped).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Shop */}
      <Card>
        <CardHeader>
          <CardTitle>Rewards Shop</CardTitle>
          <CardDescription>
            Spend your points to unlock amazing rewards and customize your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="owned">Owned</TabsTrigger>
              <TabsTrigger value="affordable">Affordable</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRewards.map((reward) => (
                  <Card 
                    key={reward.id} 
                    className={`relative overflow-hidden transition-all hover:shadow-lg ${
                      reward.owned ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 
                      reward.canAfford ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 
                      'opacity-75'
                    }`}
                  >
                    {/* Rarity indicator */}
                    <div className={`absolute top-0 right-0 w-16 h-16 ${getRarityColor(reward.rarity)} opacity-20 rounded-bl-full`} />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getTypeIcon(reward.type)}</div>
                          <div>
                            <CardTitle className="text-lg">{reward.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {getRarityIcon(reward.rarity)}
                              <Badge variant="outline" className="text-xs">
                                {reward.cost} pts
                              </Badge>
                              {reward.equipped && (
                                <Badge className="text-xs bg-green-100 text-green-800">
                                  Equipped
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-4">
                        {reward.description}
                      </p>

                      {/* Reward preview */}
                      {reward.type === 'title' && (
                        <div className="mb-4 p-2 bg-gray-100 rounded text-center">
                          <span className={`font-bold ${reward.value.color || 'text-gray-800'}`}>
                            {reward.value.title}
                          </span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        {!reward.owned ? (
                          <Button
                            onClick={() => purchaseRewardMutation.mutate(reward.id)}
                            disabled={!reward.canAfford || purchaseRewardMutation.isPending}
                            className="flex-1"
                            variant={reward.canAfford ? "default" : "secondary"}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {purchaseRewardMutation.isPending ? 'Buying...' : 
                             reward.canAfford ? 'Purchase' : 'Not enough points'}
                          </Button>
                        ) : (
                          <div className="flex gap-2 flex-1">
                            {reward.equipped ? (
                              <Button
                                onClick={() => unequipRewardMutation.mutate(reward.id)}
                                disabled={unequipRewardMutation.isPending}
                                variant="outline"
                                className="flex-1"
                              >
                                {unequipRewardMutation.isPending ? 'Unequipping...' : 'Unequip'}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => equipRewardMutation.mutate(reward.id)}
                                disabled={equipRewardMutation.isPending}
                                className="flex-1"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {equipRewardMutation.isPending ? 'Equipping...' : 'Equip'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {reward.owned && (
                        <Badge className="mt-3 bg-green-100 text-green-800 hover:bg-green-100">
                          <Gift className="h-3 w-3 mr-1" />
                          Owned
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredRewards.length === 0 && (
                <div className="text-center py-12">
                  <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No rewards found
                  </h3>
                  <p className="text-muted-foreground">
                    Try a different category or earn more points to unlock rewards!
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}