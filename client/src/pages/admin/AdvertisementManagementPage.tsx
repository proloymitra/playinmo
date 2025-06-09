import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, MousePointer, TrendingUp, Play, Volume2, Image } from "lucide-react";
import type { Advertisement } from "@shared/schema";

interface AdForm {
  title: string;
  description: string;
  type: string;
  mediaUrl: string;
  clickUrl: string;
  placement: string;
  priority: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  budget?: number;
  costPerClick?: number;
  costPerView?: number;
}

const initialFormData: AdForm = {
  title: "",
  description: "",
  type: "image",
  mediaUrl: "",
  clickUrl: "",
  placement: "banner",
  priority: 1,
  isActive: true,
  budget: 0,
  costPerClick: 0,
  costPerView: 0
};

export default function AdvertisementManagementPage() {
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdForm>(initialFormData);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: advertisements = [] } = useQuery({
    queryKey: ["/api/admin/advertisements"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/advertisements/stats"],
  });

  const createMutation = useMutation({
    mutationFn: (data: AdForm) => apiRequest("/api/admin/advertisements", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements/stats"] });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
      toast({
        title: "Success",
        description: "Advertisement created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create advertisement",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdForm> }) =>
      apiRequest(`/api/admin/advertisements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements/stats"] });
      setIsEditDialogOpen(false);
      setSelectedAd(null);
      setFormData(initialFormData);
      toast({
        title: "Success",
        description: "Advertisement updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update advertisement",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/advertisements/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements/stats"] });
      toast({
        title: "Success",
        description: "Advertisement deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete advertisement",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (ad: Advertisement) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      type: ad.type,
      mediaUrl: ad.mediaUrl,
      clickUrl: ad.clickUrl || "",
      placement: ad.placement,
      priority: ad.priority,
      isActive: ad.isActive,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : "",
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : "",
      budget: Number(ad.budget) || 0,
      costPerClick: Number(ad.costPerClick) || 0,
      costPerView: Number(ad.costPerView) || 0
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this advertisement?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAd) {
      updateMutation.mutate({ id: selectedAd.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getAdTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Play className="h-4 w-4" />;
      case 'audio': return <Volume2 className="h-4 w-4" />;
      default: return <Image className="h-4 w-4" />;
    }
  };

  const AdForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="mediaUrl">Media URL</Label>
          <Input
            id="mediaUrl"
            value={formData.mediaUrl}
            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="clickUrl">Click URL</Label>
          <Input
            id="clickUrl"
            value={formData.clickUrl}
            onChange={(e) => setFormData({ ...formData, clickUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="placement">Placement</Label>
          <Select value={formData.placement} onValueChange={(value) => setFormData({ ...formData, placement: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="sidebar">Sidebar</SelectItem>
              <SelectItem value="popup">Popup</SelectItem>
              <SelectItem value="interstitial">Interstitial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            min="1"
            max="10"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Active</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="budget">Budget ($)</Label>
          <Input
            id="budget"
            type="number"
            step="0.01"
            min="0"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="costPerClick">Cost per Click ($)</Label>
          <Input
            id="costPerClick"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPerClick}
            onChange={(e) => setFormData({ ...formData, costPerClick: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="costPerView">Cost per View ($)</Label>
          <Input
            id="costPerView"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPerView}
            onChange={(e) => setFormData({ ...formData, costPerView: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setFormData(initialFormData);
            setSelectedAd(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {selectedAd ? "Update" : "Create"} Advertisement
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advertisement Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Advertisement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Advertisement</DialogTitle>
            </DialogHeader>
            <AdForm />
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Ads</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Ads</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MousePointer className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Total Clicks</p>
                  <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Advertisements</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {advertisements.map((ad: Advertisement) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getAdTypeIcon(ad.type)}
                      <CardTitle className="text-lg">{ad.title}</CardTitle>
                      <Badge variant={ad.isActive ? "default" : "secondary"}>
                        {ad.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{ad.placement}</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Views</p>
                      <p>{ad.viewCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Clicks</p>
                      <p>{ad.clickCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">CTR</p>
                      <p>{ad.viewCount > 0 ? ((ad.clickCount / ad.viewCount) * 100).toFixed(2) : '0.00'}%</p>
                    </div>
                    <div>
                      <p className="font-medium">Priority</p>
                      <p>{ad.priority}</p>
                    </div>
                  </div>
                  {ad.description && (
                    <p className="mt-2 text-gray-600">{ad.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
            {advertisements.filter((ad: Advertisement) => ad.isActive).map((ad: Advertisement) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getAdTypeIcon(ad.type)}
                      <CardTitle className="text-lg">{ad.title}</CardTitle>
                      <Badge variant="default">Active</Badge>
                      <Badge variant="outline">{ad.placement}</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Views</p>
                      <p>{ad.viewCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Clicks</p>
                      <p>{ad.clickCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">CTR</p>
                      <p>{ad.viewCount > 0 ? ((ad.clickCount / ad.viewCount) * 100).toFixed(2) : '0.00'}%</p>
                    </div>
                    <div>
                      <p className="font-medium">Priority</p>
                      <p>{ad.priority}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid gap-4">
            {advertisements.filter((ad: Advertisement) => !ad.isActive).map((ad: Advertisement) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getAdTypeIcon(ad.type)}
                      <CardTitle className="text-lg">{ad.title}</CardTitle>
                      <Badge variant="secondary">Inactive</Badge>
                      <Badge variant="outline">{ad.placement}</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Views</p>
                      <p>{ad.viewCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Clicks</p>
                      <p>{ad.clickCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">CTR</p>
                      <p>{ad.viewCount > 0 ? ((ad.clickCount / ad.viewCount) * 100).toFixed(2) : '0.00'}%</p>
                    </div>
                    <div>
                      <p className="font-medium">Priority</p>
                      <p>{ad.priority}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Advertisement</DialogTitle>
          </DialogHeader>
          <AdForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}