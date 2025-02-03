import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { type InsertArticle, type SelectRestaurant } from "@db/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import TipTapEditor from "@/components/editor/tiptap-editor";
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MapPin, Plus, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminLayout from "@/components/layout/admin-layout";

const editArticleSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  slug: z.string().min(1, "スラッグは必須です").regex(/^[a-z0-9-]+$/, {
    message: "スラッグは半角英数字とハイフンのみ使用できます",
  }),
  content: z.any(),
  excerpt: z.string().min(1, "抜粋は必須です"),
  coverImage: z.string().min(1, "カバー画像は必須です"),
  type: z.enum(["review", "list"]),
  published: z.boolean().default(false),
});

type FormValues = z.infer<typeof editArticleSchema>;

type ArticleResponse = {
  id: number;
  title: string;
  slug: string;
  content: any;
  excerpt: string;
  coverImage: string;
  type: "review" | "list";
  published: boolean;
  restaurants?: Array<SelectRestaurant & { description?: string; order: number }>;
};

export default function EditArticlePage() {
  const [match, params] = useRoute("/admin/articles/edit/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
    // Initial state for editor content
  const [editorContent, setEditorContent] = useState(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Array<SelectRestaurant & { description?: string; order: number }>>([]);

  const { data: article, isLoading: isLoadingArticle } = useQuery<ArticleResponse>({
    queryKey: [`/api/articles/id/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: restaurants } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(editArticleSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: null,
      excerpt: "",
      coverImage: "",
      type: "review",
      published: false,
    }
  });


  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!params?.id) throw new Error("Article ID is required");

      // Always use the latest editor content
      const articleData = {
        ...values,
        content: editorContent,
        restaurants: selectedRestaurants,
      };

      console.log('Sending article data:', articleData);

      const res = await apiRequest("PATCH", `/api/articles/${params.id}`, articleData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update article");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      queryClient.invalidateQueries({ queryKey: [`/api/articles/id/${params?.id}`] });

      toast({
        title: "記事を更新しました",
        description: "記事が正常に更新されました。",
      });

      // Navigate after a short delay to ensure toast is visible
      setTimeout(() => {
        setLocation("/admin/articles");
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "記事の更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form values when article data is loaded
  useEffect(() => {
    if (article) {
      console.log('Loading article data:', article);

      // Parse content if it's a string
      const parsedContent = typeof article.content === 'string' 
        ? JSON.parse(article.content) 
        : article.content;

      console.log('Parsed content:', parsedContent);
      setEditorContent(parsedContent);

      // Reset form with all values
      form.reset({
        title: article.title,
        slug: article.slug,
        content: parsedContent,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        type: article.type,
        published: article.published,
      });

      // Update UI state
      setPreviewImage(article.coverImage);
      if (article.restaurants) {
        setSelectedRestaurants(article.restaurants);
      }
    }
  }, [article, form]);

  if (isLoadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "エラー",
        description: "画像ファイルを選択してください。",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      form.setValue('coverImage', base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAddRestaurant = (restaurant: SelectRestaurant) => {
    const articleType = form.watch("type");
    if (articleType === "review" && selectedRestaurants.length > 0) {
      setSelectedRestaurants([{ ...restaurant, order: 0, description: "" }]);
    } else {
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

  const articleType = form.watch('type');

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>記事を編集</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
                className="space-y-6"
              >
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">基本情報</TabsTrigger>
                    <TabsTrigger value="restaurants">レストラン情報</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6">
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

                   <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>本文</FormLabel>
                          <FormControl>
                            <TipTapEditor
                              content={editorContent}
                              onChange={(newContent) => {
                                console.log('Editor content updated:', newContent);
                                setEditorContent(newContent);
                                field.onChange(newContent);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                            <FormLabel className="text-base">公開ステータス</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              この記事を公開するかどうかを設定します
                            </div>
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

                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>カバー画像</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                {...field}
                              />
                              {(previewImage || value) && (
                                <img
                                  src={previewImage || value}
                                  alt="プレビュー"
                                  className="max-w-md rounded-lg"
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  <TabsContent value="restaurants" className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">
                        {articleType === "review"
                          ? "レビュー対象のレストラン"
                          : "リストに含めるレストラン"}
                      </h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
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
                                        onClick={() => handleAddRestaurant(restaurant)}
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

                    {selectedRestaurants.length > 0 ? (
                      <div className="space-y-4">
                        {selectedRestaurants.map((restaurant) => (
                          <Card key={restaurant.id}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-medium">{restaurant.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {restaurant.address}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveRestaurant(restaurant.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {articleType === "list" && (
                                <Textarea
                                  placeholder="このレストランについての説明を入力してください"
                                  value={restaurant.description}
                                  onChange={(e) =>
                                    handleRestaurantDescriptionChange(
                                      restaurant.id,
                                      e.target.value
                                    )
                                  }
                                  className="mt-2"
                                />
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        レストランが選択されていません
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/admin/articles")}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    記事を更新
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}