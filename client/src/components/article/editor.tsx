import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { SelectArticle, SelectRestaurant } from "@db/schema";
import { ImagePlus, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface ArticleEditorProps {
  article?: SelectArticle | null;
  onClose: () => void;
}

const defaultContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ text: "" }]
    }
  ]
};

type SelectedRestaurant = SelectRestaurant & {
  description?: string;
  order: number;
};

export default function ArticleEditor({ article, onClose }: ArticleEditorProps) {
  const { toast } = useToast();
  const [selectedRestaurants, setSelectedRestaurants] = useState<SelectedRestaurant[]>(
    article?.restaurants || []
  );
  const [restaurantDialogOpen, setRestaurantDialogOpen] = useState(false);

  const { data: restaurants } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const form = useForm({
    resolver: zodResolver(z.object({
      title: z.string().min(1, "Title is required"),
      slug: z.string().min(1, "Slug is required"),
      excerpt: z.string().min(1, "Excerpt is required"),
      content: z.any(),
      coverImage: z.string().url("Must be a valid URL"),
      type: z.enum(["review", "list", "essay"]),
      published: z.boolean(),
    })),
    defaultValues: {
      title: article?.title || "",
      slug: article?.slug || "",
      excerpt: article?.excerpt || "",
      content: article?.content ? 
        (typeof article.content === 'string' ? JSON.parse(article.content) : article.content) : 
        defaultContent,
      coverImage: article?.coverImage || "",
      type: article?.type || "review",
      published: article?.published || false,
    },
  });

  const handleAddRestaurant = (restaurant: SelectRestaurant) => {
    const articleType = form.watch("type");
    if (articleType === "review" && selectedRestaurants.length > 0) {
      // レビュー記事の場合は1つのレストランのみ
      setSelectedRestaurants([{ ...restaurant, order: 0, description: "" }]);
    } else {
      // リスト記事の場合は複数のレストランを追加可能
      setSelectedRestaurants([
        ...selectedRestaurants,
        { ...restaurant, order: selectedRestaurants.length, description: "" },
      ]);
    }
  };

  const handleRemoveRestaurant = (restaurantId: number) => {
    setSelectedRestaurants(
      selectedRestaurants
        .filter((r) => r.id !== restaurantId)
        .map((r, index) => ({ ...r, order: index }))
    );
  };

  const handleRestaurantDescriptionChange = (restaurantId: number, description: string) => {
    setSelectedRestaurants(
      selectedRestaurants.map((r) =>
        r.id === restaurantId ? { ...r, description } : r
      )
    );
  };

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const articleData = {
        ...values,
        restaurants: selectedRestaurants,
      };

      if (article) {
        await apiRequest("PATCH", `/api/articles/${article.id}`, articleData);
      } else {
        await apiRequest("POST", "/api/articles", articleData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Success",
        description: `記事を${article ? "更新" : "作成"}しました。`,
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

  const content = form.watch('content') || defaultContent;
  const articleType = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        {/* 基本情報フォーム */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>タイトル</FormLabel>
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
                <FormLabel>スラッグ</FormLabel>
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
              <FormLabel>抜粋</FormLabel>
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
              <FormLabel>カバー画像 URL</FormLabel>
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
                <FormLabel>記事タイプ</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedRestaurants([]);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="記事タイプを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="review">レビュー</SelectItem>
                    <SelectItem value="list">リスト</SelectItem>
                    <SelectItem value="essay">エッセイ</SelectItem>
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
                  <FormLabel>公開状態</FormLabel>
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

        {/* レストラン選択セクション */}
        {(articleType === "review" || articleType === "list") && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {articleType === "review" ? "レビュー対象のレストラン" : "リストに含めるレストラン"}
              </h3>
              <Dialog open={restaurantDialogOpen} onOpenChange={setRestaurantDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setRestaurantDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    レストランを追加
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>レストランを選択</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>店名</TableHead>
                          <TableHead>料理の種類</TableHead>
                          <TableHead>価格帯</TableHead>
                          <TableHead>住所</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restaurants?.map((restaurant) => (
                          <TableRow key={restaurant.id}>
                            <TableCell>{restaurant.name}</TableCell>
                            <TableCell>{restaurant.cuisine_type}</TableCell>
                            <TableCell>{restaurant.price_range}</TableCell>
                            <TableCell>{restaurant.address}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleAddRestaurant(restaurant);
                                  setRestaurantDialogOpen(false);
                                }}
                                disabled={selectedRestaurants.some(
                                  (r) => r.id === restaurant.id
                                )}
                              >
                                選択
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 選択されたレストラン一覧 */}
            <div className="space-y-4">
              {selectedRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="relative border rounded-lg p-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveRestaurant(restaurant.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <h4 className="font-medium mb-2">{restaurant.name}</h4>
                  {articleType === "list" && (
                    <Textarea
                      value={restaurant.description || ""}
                      onChange={(e) =>
                        handleRestaurantDescriptionChange(restaurant.id, e.target.value)
                      }
                      placeholder="このレストランについての説明を入力してください"
                      className="mt-2"
                    />
                  )}
                </div>
              ))}
              {selectedRestaurants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  レストランが選択されていません
                </div>
              )}
            </div>
          </div>
        )}

        {/* 本文コンテンツ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">本文</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const content = form.getValues('content') || defaultContent;
                  form.setValue('content', {
                    ...content,
                    content: [
                      ...(content.content || []),
                      { type: 'paragraph', content: [{ text: '' }] }
                    ],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                テキストを追加
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const content = form.getValues('content') || defaultContent;
                  form.setValue('content', {
                    ...content,
                    content: [
                      ...(content.content || []),
                      { type: 'image', attrs: { src: '', alt: '', caption: '' } }
                    ],
                  });
                }}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                画像を追加
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {content.content && content.content.map((block: ContentBlock, index: number) => (
              <div key={index} className="relative border rounded-lg p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    const content = form.getValues('content') || defaultContent;
                    const newContent = [...content.content];
                    newContent.splice(index, 1);
                    form.setValue('content', { ...content, content: newContent });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>

                {block.type === 'paragraph' && (
                  <Textarea
                    value={block.content?.[0]?.text || ''}
                    onChange={(e) => {
                      const content = form.getValues('content') || defaultContent;
                      const newContent = [...content.content];
                      newContent[index] = {
                        ...block,
                        content: [{ text: e.target.value }],
                      };
                      form.setValue('content', { ...content, content: newContent });
                    }}
                    placeholder="テキストを入力..."
                    className="min-h-[100px]"
                  />
                )}

                {block.type === 'image' && (
                  <div className="space-y-4">
                    <Input
                      value={block.attrs?.src || ''}
                      onChange={(e) => {
                        const content = form.getValues('content') || defaultContent;
                        const newContent = [...content.content];
                        newContent[index] = {
                          ...block,
                          attrs: { ...block.attrs, src: e.target.value },
                        };
                        form.setValue('content', { ...content, content: newContent });
                      }}
                      placeholder="画像URL"
                    />
                    <Input
                      value={block.attrs?.alt || ''}
                      onChange={(e) => {
                        const content = form.getValues('content') || defaultContent;
                        const newContent = [...content.content];
                        newContent[index] = {
                          ...block,
                          attrs: { ...block.attrs, alt: e.target.value },
                        };
                        form.setValue('content', { ...content, content: newContent });
                      }}
                      placeholder="画像の代替テキスト"
                    />
                    <Input
                      value={block.attrs?.caption || ''}
                      onChange={(e) => {
                        const content = form.getValues('content') || defaultContent;
                        const newContent = [...content.content];
                        newContent[index] = {
                          ...block,
                          attrs: { ...block.attrs, caption: e.target.value },
                        };
                        form.setValue('content', { ...content, content: newContent });
                      }}
                      placeholder="画像のキャプション"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </Form>
  );
}