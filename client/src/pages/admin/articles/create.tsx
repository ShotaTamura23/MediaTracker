import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { insertArticleSchema, type InsertArticle, type SelectRestaurant } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const createArticleSchema = insertArticleSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  slug: true,
});

const defaultEditorContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "" }]
    }
  ]
};

type SelectedRestaurant = SelectRestaurant & {
  description?: string;
  order: number;
};

export default function CreateArticlePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedRestaurants, setSelectedRestaurants] = useState<SelectedRestaurant[]>([]);

  const { data: restaurants } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const form = useForm<z.infer<typeof createArticleSchema>>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: "",
      content: defaultEditorContent,
      excerpt: "",
      coverImage: "",
      type: "review",
      published: false,
      isNewOpening: false,
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createArticleSchema>) => {
      if (!user) throw new Error("認証が必要です");

      const articleData: InsertArticle & { restaurants: SelectedRestaurant[] } = {
        ...data,
        authorId: user.id,
        restaurants: selectedRestaurants,
      };

      const res = await apiRequest("POST", "/api/articles", articleData);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "記事の作成に失敗しました");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "記事を作成しました",
        description: "新しい記事が正常に作成されました。",
      });
      setLocation("/admin/articles");
    },
    onError: (error: Error) => {
      toast({
        title: "記事の作成に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        form.setValue("coverImage", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  const articleType = form.watch("type");

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>新規記事作成</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createArticleMutation.mutate(data))}
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
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>本文</FormLabel>
                        <FormControl>
                          <TipTapEditor
                            content={field.value}
                            onChange={field.onChange}
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
                            if (value !== "review") {
                              form.setValue("isNewOpening", false);
                            }
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

                  {articleType === "review" && (
                    <FormField
                      control={form.control}
                      name="isNewOpening"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>新着店舗リストに表示</FormLabel>
                            <FormDescription>
                              このチェックを入れると、新着店舗一覧ページに表示されます。
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}

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
                            {previewImage && (
                              <img
                                src={previewImage}
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
                  disabled={createArticleMutation.isPending}
                >
                  {createArticleMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  記事を作成
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}