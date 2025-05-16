import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Save, Trash2, X, Image, Link, Type, Code, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';

interface WebsiteContent {
  id: number;
  section: string;
  key: string;
  value: string;
  valueType: string;
  updatedAt: string;
}

// Schema for form validation
const contentFormSchema = z.object({
  section: z.string().min(1, "Section is required"),
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  valueType: z.string().default("text")
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

export default function CMSWebsiteContentPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editItem, setEditItem] = useState<WebsiteContent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<WebsiteContent | null>(null);
  const queryClient = useQueryClient();

  // Fetch all website content
  const { data: allContent, isLoading } = useQuery<WebsiteContent[]>({
    queryKey: ['/api/admin/website-content'],
  });

  // Get unique sections for tabs
  const sections = allContent 
    ? [...new Set(allContent.map(item => item.section))]
    : [];

  // Filter content based on active tab and search query
  const filteredContent = allContent
    ? allContent.filter(item => {
        const matchesTab = activeTab === "all" || item.section === activeTab;
        const matchesSearch = searchQuery === "" || 
          item.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.value.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesTab && matchesSearch;
      })
    : [];

  // Mutations for content management
  const updateContentMutation = useMutation({
    mutationFn: async (data: { id: number, updateData: Partial<WebsiteContent> }) => {
      const response = await fetch(`/api/admin/website-content/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update website content');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Content updated',
        description: 'Website content has been successfully updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website-content'] });
      setIsDialogOpen(false);
      setEditItem(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });

  const createContentMutation = useMutation({
    mutationFn: async (data: ContentFormValues) => {
      const response = await fetch('/api/admin/website-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create website content');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Content created',
        description: 'New website content has been successfully created',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website-content'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/website-content/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete website content');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Content deleted',
        description: 'Website content has been successfully deleted',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/website-content'] });
      setContentToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    },
  });

  // Content Edit Dialog
  function ContentEditDialog() {
    const form = useForm<ContentFormValues>({
      resolver: zodResolver(contentFormSchema),
      defaultValues: editItem ? {
        section: editItem.section,
        key: editItem.key,
        value: editItem.value,
        valueType: editItem.valueType,
      } : {
        section: '',
        key: '',
        value: '',
        valueType: 'text',
      }
    });

    // Handle form submission
    function onSubmit(data: ContentFormValues) {
      if (editItem) {
        // Update existing content
        updateContentMutation.mutate({
          id: editItem.id,
          updateData: data
        });
      } else {
        // Create new content
        createContentMutation.mutate(data);
      }
    }

    // Get value type icon
    const getValueTypeIcon = (type: string) => {
      switch (type) {
        case 'text': return <Type className="h-4 w-4" />;
        case 'html': return <Code className="h-4 w-4" />;
        case 'image': return <Image className="h-4 w-4" />;
        case 'link': return <Link className="h-4 w-4" />;
        default: return <FileText className="h-4 w-4" />;
      }
    };

    return (
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) setIsDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Content' : 'Add New Content'}</DialogTitle>
            <DialogDescription>
              {editItem 
                ? 'Update website content. Changes will be reflected on the website immediately.'
                : 'Add new website content. This will be available on the website immediately.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., hero, footer, about" 
                          {...field} 
                          disabled={!!editItem}
                        />
                      </FormControl>
                      <FormDescription>
                        The website section this content belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., title, subtitle, image" 
                          {...field} 
                          disabled={!!editItem}
                        />
                      </FormControl>
                      <FormDescription>
                        Identifier for this content item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="valueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center">
                            <Type className="h-4 w-4 mr-2" /> 
                            Text
                          </div>
                        </SelectItem>
                        <SelectItem value="html">
                          <div className="flex items-center">
                            <Code className="h-4 w-4 mr-2" /> 
                            HTML
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center">
                            <Image className="h-4 w-4 mr-2" /> 
                            Image URL
                          </div>
                        </SelectItem>
                        <SelectItem value="link">
                          <div className="flex items-center">
                            <Link className="h-4 w-4 mr-2" /> 
                            Link URL
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of content determines how it will be displayed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Value</FormLabel>
                    <FormControl>
                      {field.value && form.watch('valueType') === 'image' ? (
                        <div className="mb-2">
                          <img 
                            src={field.value} 
                            alt="Preview" 
                            className="max-h-40 object-contain mb-2" 
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          />
                        </div>
                      ) : null}
                      
                      {form.watch('valueType') === 'html' ? (
                        <Textarea 
                          placeholder="Enter HTML content" 
                          className="font-mono text-sm h-40" 
                          {...field} 
                        />
                      ) : (
                        <Input 
                          placeholder={
                            form.watch('valueType') === 'image' ? 'https://example.com/image.jpg' :
                            form.watch('valueType') === 'link' ? 'https://example.com/page' :
                            'Enter content value'
                          }
                          {...field} 
                        />
                      )}
                    </FormControl>
                    <FormDescription>
                      {form.watch('valueType') === 'image' ? 'URL to an image file' :
                       form.watch('valueType') === 'link' ? 'URL to link to' :
                       form.watch('valueType') === 'html' ? 'HTML content with tags' :
                       'Text content to display'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateContentMutation.isPending || createContentMutation.isPending}
                >
                  {updateContentMutation.isPending || createContentMutation.isPending ? 
                    'Saving...' : editItem ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // Value display component
  const ContentValue = ({ content }: { content: WebsiteContent }) => {
    if (content.valueType === 'image') {
      return (
        <div className="flex items-center">
          <div className="w-10 h-10 mr-2 bg-muted rounded overflow-hidden">
            <img 
              src={content.value} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=Error';
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
            {content.value}
          </span>
        </div>
      );
    }
    
    if (content.valueType === 'html') {
      return (
        <div className="flex items-center">
          <Code className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {content.value}
          </span>
        </div>
      );
    }
    
    return (
      <span className="truncate max-w-[250px]">
        {content.value}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Website Content Management</h1>
        <Button onClick={() => {
          setEditItem(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </Button>
      </div>
      
      {ContentEditDialog()}
      
      <Card>
        <CardHeader>
          <CardTitle>Website Content</CardTitle>
          <CardDescription>
            Manage content that appears throughout the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 overflow-x-auto flex-wrap">
                <TabsTrigger value="all">All Sections</TabsTrigger>
                {sections.map(section => (
                  <TabsTrigger key={section} value={section}>
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Loading content...
                          </TableCell>
                        </TableRow>
                      ) : filteredContent.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No content found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredContent.map((content) => (
                          <TableRow key={content.id}>
                            <TableCell className="font-medium">{content.section}</TableCell>
                            <TableCell>{content.key}</TableCell>
                            <TableCell>
                              <ContentValue content={content} />
                            </TableCell>
                            <TableCell>
                              <span className="capitalize">{content.valueType}</span>
                            </TableCell>
                            <TableCell>
                              {new Date(content.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setEditItem(content);
                                    setIsDialogOpen(true);
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
                                      <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{content.section}.{content.key}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteContentMutation.mutate(content.id)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        {deleteContentMutation.isPending && contentToDelete?.id === content.id 
                                          ? 'Deleting...' 
                                          : 'Delete'}
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
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}