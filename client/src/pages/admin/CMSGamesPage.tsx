import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusCircle, 
  Search,
  Trash2,
  Edit,
  ArrowUpDown,
  Star,
  Flame,
  AlertTriangle
} from 'lucide-react';

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// New game schema for form validation
const newGameSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  imageUrl: z.string().url({ message: "Valid image URL is required" }),
  externalUrl: z.string().url({ message: "Valid game URL is required" }).optional(),
  htmlPackage: z.any().optional(),
  isNew: z.boolean().default(false),
  isHot: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

// Add Game Dialog component
function AddGameDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [gameType, setGameType] = useState<'url' | 'html'>('url');
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    select: (data) => data || []
  });
  
  const form = useForm<z.infer<typeof newGameSchema>>({
    resolver: zodResolver(newGameSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      imageUrl: '',
      externalUrl: '',
      isNew: true,
      isHot: false,
      isFeatured: false,
    },
  });
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setGameType('url');
    }
  }, [isOpen, form]);
  
  const createGameMutation = useMutation({
    mutationFn: async (values: z.infer<typeof newGameSchema>) => {
      // For URL-based games
      if (gameType === 'url') {
        const response = await fetch('/api/games', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: values.title,
            description: values.description,
            category: values.category,
            imageUrl: values.imageUrl,
            externalUrl: values.externalUrl,
            new: values.isNew,
            hot: values.isHot,
            featured: values.isFeatured,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create game');
        }
        
        return await response.json();
      } 
      // For HTML package uploads
      else {
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description);
        formData.append('category', values.category);
        formData.append('imageUrl', values.imageUrl);
        formData.append('new', String(values.isNew));
        formData.append('hot', String(values.isHot));
        formData.append('featured', String(values.isFeatured));
        
        if (values.htmlPackage && values.htmlPackage[0]) {
          formData.append('htmlPackage', values.htmlPackage[0]);
        }
        
        const response = await fetch('/api/games/upload', {
          method: 'POST',
          body: formData,
        });
        
        setIsUploading(false);
        
        if (!response.ok) {
          throw new Error('Failed to upload game package');
        }
        
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: "Success",
        description: "Game created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof newGameSchema>) => {
    createGameMutation.mutate(values);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      form.setValue('htmlPackage', files);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Game</DialogTitle>
          <DialogDescription>
            Create a new game by providing either a URL or uploading an HTML package.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="url" className="w-full" onValueChange={(value) => setGameType(value as 'url' | 'html')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">External URL</TabsTrigger>
            <TabsTrigger value="html">HTML Package</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Game title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriesLoading ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : (
                            categories?.map((category: any) => (
                              <SelectItem key={category.id} value={category.slug}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter game description" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to the thumbnail image for this game
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <TabsContent value="url" className="space-y-4 mt-0">
                <FormField
                  control={form.control}
                  name="externalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/game" {...field} />
                      </FormControl>
                      <FormDescription>
                        Direct link to the playable game
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="html" className="space-y-4 mt-0">
                <FormItem>
                  <FormLabel>HTML Package (ZIP)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a ZIP file containing your HTML game
                  </FormDescription>
                </FormItem>
              </TabsContent>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>New Game</FormLabel>
                        <FormDescription>
                          Mark as new release
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isHot"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Hot Game</FormLabel>
                        <FormDescription>
                          Mark as trending
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Featured</FormLabel>
                        <FormDescription>
                          Show on homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={createGameMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createGameMutation.isPending}
                >
                  {createGameMutation.isPending 
                    ? (gameType === 'html' && isUploading ? 'Uploading...' : 'Creating...') 
                    : 'Create Game'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const gameFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().url("Please enter a valid URL"),
  categoryId: z.string().min(1, "Please select a category"),
  developer: z.string().min(2, "Developer name is required"),
  isFeatured: z.boolean().optional(),
  gameType: z.enum(["url", "html"]),
  externalUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  htmlPackage: z.string().optional(),
  instructions: z.string().min(10, "Instructions must be at least 10 characters"),
  releaseDate: z.string().min(1, "Release date is required"),
})

type GameFormValues = z.infer<typeof gameFormSchema>;

// Game Create Dialog
function GameCreateDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [gameType, setGameType] = useState<'url' | 'html'>('url');
  
  const defaultValues = {
    title: '',
    description: '',
    imageUrl: '',
    categoryId: '',
    developer: '',
    isFeatured: false,
    gameType: 'url' as const,
    externalUrl: '',
    htmlPackage: '',
    instructions: 'Use your mouse or touchscreen to play. Click or tap to interact with the game.',
    releaseDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  };
  
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameFormSchema),
    defaultValues
  });

  // Update form when game type changes
  useEffect(() => {
    form.setValue('gameType', gameType);
    
    // Clear the other field when switching types
    if (gameType === 'url') {
      form.setValue('htmlPackage', '');
    } else {
      form.setValue('externalUrl', '');
    }
  }, [gameType, form]);
  
  // Get all categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });
  
  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use the correct API endpoint
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create game');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Game created',
        description: 'The game has been successfully added',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/featured'] });
      onClose();
      form.reset(defaultValues);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });
  
  function onSubmit(data: GameFormValues) {
    // For URL-based games
    if (data.gameType === 'url') {
      // Convert data for the API
      const submitData = {
        title: data.title,
        description: data.description,
        category: data.categoryId, // Send category ID as the slug
        imageUrl: data.imageUrl,
        externalUrl: data.externalUrl,
        developer: data.developer,
        instructions: data.instructions,
        featured: !!data.isFeatured
      };
      
      createGameMutation.mutate(submitData);
    } 
    // For HTML package uploads
    else {
      // We'd need to handle file upload with FormData
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.categoryId);
      formData.append('imageUrl', data.imageUrl);
      formData.append('developer', data.developer);
      formData.append('instructions', data.instructions);
      formData.append('featured', data.isFeatured ? 'true' : 'false');
      
      // If there's an HTML package as a file input, append it
      if (data.htmlPackage && typeof data.htmlPackage === 'object') {
        formData.append('htmlPackage', data.htmlPackage);
      }
      
      // Use fetch directly for FormData upload
      fetch('/api/games/upload', {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to upload HTML game package');
        }
        return response.json();
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/games'] });
        queryClient.invalidateQueries({ queryKey: ['/api/games/featured'] });
        toast({
          title: "Success",
          description: "Game created successfully",
        });
        onClose();
        form.reset(defaultValues);
      })
      .catch(error => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to upload game: ${error.message}`,
        });
      });
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Game</DialogTitle>
          <DialogDescription>
            Add a new game to your platform. You can either link to an external game URL or upload an HTML game package.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Game title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Game description" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="developer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Developer</FormLabel>
                    <FormControl>
                      <Input placeholder="Game developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="releaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Instructions</FormLabel>
                  <FormControl>
                    <Textarea placeholder="How to play the game" {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-2">
              <FormLabel>Game Type</FormLabel>
              <div className="flex space-x-4">
                <Button 
                  type="button" 
                  variant={gameType === 'url' ? 'default' : 'outline'}
                  onClick={() => setGameType('url')}
                  className="flex-1"
                >
                  External URL
                </Button>
                <Button 
                  type="button" 
                  variant={gameType === 'html' ? 'default' : 'outline'}
                  onClick={() => setGameType('html')}
                  className="flex-1"
                >
                  HTML Package
                </Button>
              </div>
            </div>
            
            {gameType === 'url' ? (
              <FormField
                control={form.control}
                name="externalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/game" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the full URL to an external game that can be embedded in an iframe.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="htmlPackage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML Game Package</FormLabel>
                    <FormControl>
                      <Input placeholder="URL to a ZIP file containing the HTML game" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a URL to a ZIP file containing the HTML game package.
                      The ZIP should include an index.html file at the root.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured Game</FormLabel>
                    <FormDescription>
                      This game will be displayed in the featured games section.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createGameMutation.isPending}
              >
                {createGameMutation.isPending ? 'Creating...' : 'Add Game'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Game Edit Dialog
function GameEditDialog({ game, isOpen, onClose }: { game: Game | null, isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: game ? {
      title: game.title || '',
      description: game.description || '',
      imageUrl: game.imageUrl || '',
      categoryId: game.categoryId?.toString() || '',
      developer: game.developer || '',
      isFeatured: game.isFeatured || false,
      externalUrl: game.externalUrl || '',
    } : {}
  });
  
  // Handle form submission
  function onSubmit(data: any) {
    if (!game) return;
    
    const updateData = {
      ...data,
      categoryId: parseInt(data.categoryId),
      isFeatured: !!data.isFeatured,
    };
    
    updateGameMutation.mutate({ 
      id: game.id, 
      updateData 
    });
  }
  
  // Get all categories
  const { data: categories } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });
  
  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async (data: { id: number, updateData: Partial<Game> }) => {
      const response = await fetch(`/api/admin/games/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update game');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Game updated',
        description: 'The game has been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/featured'] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });
  
  if (!game) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            Update the game details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Game title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Game description" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="externalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/game" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="developer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Developer</FormLabel>
                    <FormControl>
                      <Input placeholder="Game developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Featured Game</FormLabel>
                    <FormDescription>
                      This game will be displayed in the featured games section.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateGameMutation.isPending}
              >
                {updateGameMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CMSGamesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get all games
  const { data: games, isLoading: isGamesLoading } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  // Get all categories
  const { data: categories } = useQuery<any[]>({
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
      queryClient.invalidateQueries({ queryKey: ['/api/games/featured'] });
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
  
  // Update game mutation (reference only - actual implementation is in GameEditDialog)
  const updateGameMutation = useMutation({
    mutationFn: async (data: { id: number, updateData: Partial<Game> }) => {
      return null; // Placeholder, actual implementation is in GameEditDialog
    },
    onSuccess: () => {
      // Placeholder, actual implementation is in GameEditDialog
    },
    onError: (error) => {
      // Placeholder, actual implementation is in GameEditDialog
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

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Games Management</h1>
        <Button onClick={() => setIsNewGameDialogOpen(true)}>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
                <DropdownMenuItem>Name (Z-A)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Newest First</DropdownMenuItem>
                <DropdownMenuItem>Oldest First</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Most Played</DropdownMenuItem>
                <DropdownMenuItem>Highest Rated</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Game Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Plays</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isGamesLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px] mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-[80px] ml-auto" /></TableCell>
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
                                  {deleteGameMutation.isPending ? 'Deleting...' : 'Delete'}
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
    </AdminLayout>
  );
  
  // Game Edit Dialog
  function GameEditDialog({ game, isOpen, onClose }: { game: Game | null, isOpen: boolean, onClose: () => void }) {
    const form = useForm<GameFormValues>({
      resolver: zodResolver(gameFormSchema),
      defaultValues: game ? {
        title: game.title || '',
        description: game.description || '',
        imageUrl: game.imageUrl || '',
        categoryId: game.categoryId?.toString() || '',
        developer: game.developer || '',
        isFeatured: game.isFeatured || false,
        externalUrl: game.externalUrl || '',
      } : {}
    });
    
    // Handle form submission
    function onSubmit(data: GameFormValues) {
      if (!game) return;
      
      const updateData = {
        ...data,
        categoryId: parseInt(data.categoryId),
        isFeatured: !!data.isFeatured,
      };
      
      updateGameMutation.mutate({ 
        id: game.id, 
        updateData 
      });
    }
    
    if (!game) return null;
    
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update the game details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Game title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Game description" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="externalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/game" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="developer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Developer</FormLabel>
                      <FormControl>
                        <Input placeholder="Game developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Game</FormLabel>
                      <FormDescription>
                        This game will be displayed in the featured games section.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateGameMutation.isPending}
                >
                  {updateGameMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Games Management</h1>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Game
        </Button>
      </div>

      {gameToEdit && (
        <GameEditDialog
          game={gameToEdit}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setGameToEdit(null);
          }}
        />
      )}
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Games Library</CardTitle>
          <CardDescription>
            Manage games in your library.
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
                  <TableHead className="w-[250px]">Game</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Plays</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isGamesLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-[80px] mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-[50px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-[50px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-[80px] ml-auto" /></TableCell>
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
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="w-10 h-10 mr-2 overflow-hidden rounded">
                            <img 
                              src={game.imageUrl} 
                              alt={game.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {game.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {categories?.find(c => c.id === game.categoryId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {game.isFeatured && <Badge className="bg-amber-500">Featured</Badge>}
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
                                  {deleteGameMutation.isPending ? 'Deleting...' : 'Delete'}
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
      
      {/* New Game Dialog */}
      {isNewGameDialogOpen && (
        <AddGameDialog
          isOpen={isNewGameDialogOpen}
          onClose={() => setIsNewGameDialogOpen(false)}
        />
      )}
      
      {/* Edit Game Dialog */}
      {gameToEdit && (
        <GameEditDialog
          game={gameToEdit}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setGameToEdit(null);
            setIsEditDialogOpen(false);
          }}
        />
      )}
    </AdminLayout>
  );
}