import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SelectArticle } from "@db/schema";
import { ImagePlus, Plus, X } from "lucide-react";

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.any(), // Will be JSON stringified
  coverImage: z.string().url("Must be a valid URL"),
  type: z.enum(["review", "list", "essay"]),
  published: z.boolean(),
});

interface ArticleEditorProps {
  article?: SelectArticle | null;
  onClose: () => void;
}

type ContentBlock = {
  type: 'paragraph' | 'image' | 'heading';
  content?: { text: string }[];
  attrs?: {
    level?: number;
    src?: string;
    alt?: string;
    caption?: string;
  };
};

export default function ArticleEditor({ article, onClose }: ArticleEditorProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: article?.title || "",
      slug: article?.slug || "",
      excerpt: article?.excerpt || "",
      content: article?.content ? 
        (typeof article.content === 'string' ? JSON.parse(article.content) : article.content) : 
        { type: "doc", content: [] },
      coverImage: article?.coverImage || "",
      type: article?.type || "review",
      published: article?.published || false,
    },
  });

  const addContentBlock = (type: ContentBlock['type']) => {
    const content = form.getValues('content');
    const newBlock: ContentBlock = type === 'paragraph' 
      ? { type: 'paragraph', content: [{ text: '' }] }
      : type === 'image' 
      ? { type: 'image', attrs: { src: '', alt: '', caption: '' } }
      : { type: 'heading', attrs: { level: 2 }, content: [{ text: '' }] };

    form.setValue('content', {
      ...content,
      content: [...content.content, newBlock],
    });
  };

  const removeContentBlock = (index: number) => {
    const content = form.getValues('content');
    content.content.splice(index, 1);
    form.setValue('content', content);
  };

  const updateBlockContent = (index: number, field: string, value: string) => {
    const content = form.getValues('content');
    const block = content.content[index];

    if (block.type === 'paragraph' || block.type === 'heading') {
      block.content = [{ text: value }];
    } else if (block.type === 'image') {
      block.attrs = { ...block.attrs, [field]: value };
    }

    form.setValue('content', content);
  };

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof articleSchema>) => {
      if (article) {
        await apiRequest("PATCH", `/api/articles/${article.id}`, values);
      } else {
        await apiRequest("POST", "/api/articles", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Success",
        description: `Article ${article ? "updated" : "created"} successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const content = form.watch('content');
  const articleType = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Article Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="essay">Essay</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Published</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Content Blocks</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addContentBlock('paragraph')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Text
              </Button>
              {articleType !== 'list' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('image')}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              )}
              {articleType === 'list' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('heading')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Restaurant
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {content.content.map((block: ContentBlock, index: number) => (
              <div key={index} className="relative border rounded-lg p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => removeContentBlock(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {block.type === 'paragraph' && (
                  <Textarea
                    value={block.content?.[0]?.text || ''}
                    onChange={(e) => updateBlockContent(index, 'text', e.target.value)}
                    placeholder="Enter text here..."
                    className="min-h-[100px]"
                  />
                )}

                {block.type === 'image' && (
                  <div className="space-y-4">
                    <Input
                      value={block.attrs?.src || ''}
                      onChange={(e) => updateBlockContent(index, 'src', e.target.value)}
                      placeholder="Image URL"
                    />
                    <Input
                      value={block.attrs?.alt || ''}
                      onChange={(e) => updateBlockContent(index, 'alt', e.target.value)}
                      placeholder="Image alt text"
                    />
                    <Input
                      value={block.attrs?.caption || ''}
                      onChange={(e) => updateBlockContent(index, 'caption', e.target.value)}
                      placeholder="Image caption"
                    />
                  </div>
                )}

                {block.type === 'heading' && (
                  <div className="space-y-4">
                    <Input
                      value={block.content?.[0]?.text || ''}
                      onChange={(e) => updateBlockContent(index, 'text', e.target.value)}
                      placeholder="Restaurant name"
                    />
                    {index < content.content.length - 1 && 
                     content.content[index + 1].type === 'paragraph' && (
                      <Textarea
                        value={content.content[index + 1].content?.[0]?.text || ''}
                        onChange={(e) => updateBlockContent(index + 1, 'text', e.target.value)}
                        placeholder="Restaurant description"
                        className="min-h-[100px]"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}