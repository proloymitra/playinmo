import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusCircle, 
  Search,
  Trash2,
  Edit,
  Star,
  Flame,
  Globe,
  FileCode
} from 'lucide-react';

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// Simple game interface
interface Game {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  categoryId: number;
  isFeatured: boolean | null;
  plays: number | null;
  rating: number | null;
  developer: string;
  releaseDate: string;
  instructions: string;
  externalUrl: string | null;
  createdAt: string;
}

export default function CMSGamesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // State for game type selection (URL or HTML package)
  const [gameType, setGameType] = useState<'url' | 'html'>('url');
  
  // Get all games
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });
  
  // Get all categories
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });
  
  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete game');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Game deleted',
        description: 'The game has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      setGameToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });

  // Filter games based on search query
  const filteredGames = games?.filter(game => 
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };
  
  // Initialize the image preview when opening the edit dialog
  useEffect(() => {
    if (gameToEdit) {
      setImagePreview(gameToEdit.imageUrl);
    }
  }, [gameToEdit]);
  
  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // For URL-based games
        if (gameType === 'url') {
          // Make sure we have the right format for releaseDate
          const formattedData = {
            ...data,
            // Make sure releaseDate is a proper date string
            releaseDate: new Date(data.releaseDate).toISOString().split('T')[0],
            // Make sure categoryId is a number
            categoryId: typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId,
            // Default values for optional fields
            plays: data.plays || 0,
            rating: data.rating || 0
          };
          
          console.log('Sending game data:', formattedData);
          
          const response = await fetch('/api/admin/games', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formattedData),
            credentials: 'include' // Important for authentication
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(errorData.message || 'Failed to create game');
          }
          
          return response.json();
        } 
        // For HTML uploads
        else {
          const response = await fetch('/api/admin/games/upload', {
            method: 'POST',
            body: data, // FormData
            credentials: 'include' // Important for authentication
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('API error response:', errorData);
            throw new Error(errorData.message || 'Failed to upload game package');
          }
          
          return response.json();
        }
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: gameType === 'url' ? "Game added successfully" : "Game package uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error('Mutation error in component:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });
  
  // Handle form submission for adding a new game
  const handleAddGame = () => {
    try {
      // Get form values
      const title = (document.getElementById('game-title') as HTMLInputElement)?.value;
      const categorySelect = document.querySelector('[id^="radix-:"]') as HTMLSelectElement;
      const categoryId = categorySelect?.value || '1';
      const description = (document.getElementById('game-description') as HTMLTextAreaElement)?.value;
      const imageUrl = (document.getElementById('game-image') as HTMLInputElement)?.value;
      const developer = (document.getElementById('game-developer') as HTMLInputElement)?.value;
      const instructions = (document.getElementById('game-instructions') as HTMLTextAreaElement)?.value || 'Use your mouse or touchscreen to play.';
      const isFeatured = (document.getElementById('featured-game') as HTMLInputElement)?.checked;
      
      console.log('Form values:', {
        title, categoryId, description, imageUrl, developer, instructions, isFeatured
      });
      
      // Validate required fields
      if (!title) {
        toast({ title: "Error", description: "Title is required", variant: "destructive" });
        return;
      }
      
      if (!description) {
        toast({ title: "Error", description: "Description is required", variant: "destructive" });
        return;
      }
      
      if (!imageUrl) {
        toast({ title: "Error", description: "Image URL is required", variant: "destructive" });
        return;
      }
      
      // For URL-based games
      if (gameType === 'url') {
        const externalUrl = (document.getElementById('game-url') as HTMLInputElement)?.value;
        if (!externalUrl) {
          toast({ title: "Error", description: "Game URL is required", variant: "destructive" });
          return;
        }
        
        // Direct fetch instead of mutation
        toast({ title: "Processing", description: "Adding game..." });
        
        fetch('/api/admin/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title,
            description,
            imageUrl,
            categoryId: parseInt(categoryId),
            developer: developer || 'Unknown',
            externalUrl,
            instructions,
            isFeatured,
            plays: 0,
            rating: 0,
            releaseDate: new Date()
          })
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.message || 'Failed to add game');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Game added successfully:', data);
          toast({ title: "Success", description: "Game added successfully" });
          queryClient.invalidateQueries({ queryKey: ['/api/games'] });
          setIsAddDialogOpen(false);
        })
        .catch(error => {
          console.error('Error adding game:', error);
          toast({ 
            variant: "destructive", 
            title: "Error", 
            description: error.message || 'Failed to add game' 
          });
        });
      } 
      // For HTML package uploads
      else {
        const htmlFile = (document.getElementById('game-html') as HTMLInputElement)?.files?.[0];
        if (!htmlFile) {
          toast({ title: "Error", description: "HTML file is required", variant: "destructive" });
          return;
        }
        
        toast({ title: "Processing", description: "Uploading game package..." });
        
        // Create FormData
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('imageUrl', imageUrl);
        formData.append('categoryId', categoryId);
        formData.append('developer', developer || 'Unknown');
        formData.append('instructions', instructions);
        formData.append('isFeatured', isFeatured ? 'true' : 'false');
        formData.append('htmlFile', htmlFile);
        
        // Direct fetch instead of mutation
        fetch('/api/admin/games/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.message || 'Failed to upload game package');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Game package uploaded successfully:', data);
          toast({ title: "Success", description: "Game package uploaded successfully" });
          queryClient.invalidateQueries({ queryKey: ['/api/games'] });
          setIsAddDialogOpen(false);
        })
        .catch(error => {
          console.error('Error uploading game package:', error);
          toast({ 
            variant: "destructive", 
            title: "Error", 
            description: error.message || 'Failed to upload game package' 
          });
        });
      }
    } catch (error) {
      console.error('Error in handleAddGame:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while submitting the form"
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Games Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Game
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Games</CardTitle>
          <CardDescription>
            Manage all games on your platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Plays</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px] mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[50px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[40px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredGames?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No games found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGames?.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.title}</TableCell>
                      <TableCell>{getCategoryName(game.categoryId)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          {game.isFeatured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {(game.plays || 0) > 10000 && (
                            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                              <Flame className="h-3 w-3 mr-1" />
                              Hot
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{game.plays?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{(game.rating ? (game.rating/10) : 0).toFixed(1)}/5</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                              setGameToEdit(game);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Game</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{game.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteGameMutation.mutate(game.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {deleteGameMutation.isPending && gameToDelete === game.id ? (
                                    <>Deleting...</>
                                  ) : (
                                    <>Delete</>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Game Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Game</DialogTitle>
            <DialogDescription>
              Add a new game to your platform using an external URL or by uploading an HTML package
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="url" onValueChange={(value) => setGameType(value as 'url' | 'html')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>External URL</span>
              </TabsTrigger>
              <TabsTrigger value="html" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span>HTML Package</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Game Title *</label>
                <Input id="game-title" placeholder="Enter game title" required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea 
                  id="game-description"
                  placeholder="Provide a description of the game"
                  className="min-h-[100px]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL *</label>
                <Input 
                  id="game-image"
                  placeholder="https://example.com/image.jpg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Provide a URL to an image that will be used as the game thumbnail
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Developer</label>
                <Input id="game-developer" placeholder="Game developer name" />
              </div>
              
              <TabsContent value="url" className="p-0 m-0 space-y-2">
                <label className="text-sm font-medium">Game URL *</label>
                <Input 
                  id="game-url"
                  placeholder="https://example.com/game"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Provide the URL to the external game that will be embedded in an iframe
                </p>
              </TabsContent>
              
              <TabsContent value="html" className="p-0 m-0 space-y-2">
                <label className="text-sm font-medium">HTML Package *</label>
                <Input 
                  id="game-html"
                  type="file" 
                  accept=".zip,.html"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Upload a ZIP file containing your HTML game files or a single HTML file
                </p>
              </TabsContent>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Game Instructions</label>
                <Textarea 
                  id="game-instructions"
                  placeholder="How to play the game"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="featured-game" />
                <label htmlFor="featured-game" className="text-sm font-medium">
                  Featured Game
                </label>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                disabled={createGameMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddGame}
                disabled={createGameMutation.isPending}
              >
                {createGameMutation.isPending ? 
                  (gameType === 'html' ? 'Uploading...' : 'Creating...') : 
                  'Add Game'
                }
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog (Simplified) */}
      {isEditDialogOpen && gameToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && setIsEditDialogOpen(false)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Game</DialogTitle>
              <DialogDescription>
                Edit game details. Changes will be saved when you click the Save button.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input defaultValue={gameToEdit.title} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select defaultValue={gameToEdit.categoryId.toString()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  defaultValue={gameToEdit.description}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Game Icon</label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input 
                          id="edit-game-image"
                          defaultValue={gameToEdit.imageUrl} 
                          onChange={(e) => setImagePreview(e.target.value)}
                          placeholder="Enter image URL or upload a file"
                        />
                      </div>
                      <div>
                        <label htmlFor="icon-upload" className="cursor-pointer">
                          <div className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                            Upload
                          </div>
                          <input
                            type="file"
                            id="icon-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Create a temporary URL for preview
                                const tempUrl = URL.createObjectURL(file);
                                setImagePreview(tempUrl);
                                
                                // Create a FormData object for upload
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                // Upload the image
                                fetch('/api/admin/upload-image', {
                                  method: 'POST',
                                  body: formData,
                                  credentials: 'include'
                                })
                                .then(response => {
                                  if (!response.ok) {
                                    throw new Error('Image upload failed');
                                  }
                                  return response.json();
                                })
                                .then(data => {
                                  // Set the image URL input field with the new URL
                                  const imageInput = document.getElementById('edit-game-image') as HTMLInputElement;
                                  if (imageInput && data.imageUrl) {
                                    imageInput.value = data.imageUrl;
                                    toast({
                                      title: "Success",
                                      description: "Image uploaded successfully"
                                    });
                                  }
                                })
                                .catch(error => {
                                  console.error('Error uploading image:', error);
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Failed to upload image. Please try again."
                                  });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter a URL or upload an image file (recommended size: 300x300px)
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-32 w-full md:h-full rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                      <img 
                        src={imagePreview || gameToEdit.imageUrl} 
                        alt="Game icon preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/300x300?text=Preview';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Game URL</label>
                <Input defaultValue={gameToEdit.externalUrl || ''} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Developer</label>
                <Input defaultValue={gameToEdit.developer} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Game Instructions</label>
                <Textarea 
                  defaultValue={gameToEdit.instructions}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-featured-game" 
                  checked={gameToEdit.isFeatured || false}
                />
                <label htmlFor="edit-featured-game" className="text-sm font-medium">
                  Featured Game
                </label>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditGameSubmit}
                disabled={updateGameMutation.isPending}
              >
                {updateGameMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}