import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { insertArticleSchema, type InsertArticle } from "@db/schema";
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
import { Loader2, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RestaurantLocationPicker from "@/components/maps/restaurant-location-picker";

const createArticleSchema = insertArticleSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  restaurantInfo: z.object({
    name: z.string().min(1, "店名を入力してください"),
    address: z.string().min(1, "住所を入力してください"),
    description: z.string().optional(),
    cuisine_type: z.string().min(1, "料理の種類を選択してください"),
    price_range: z.string().min(1, "価格帯を選択してください"),
    latitude: z.number(),
    longitude: z.number(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  }).optional(),
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

export default function CreateArticlePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const form = useForm<z.infer<typeof createArticleSchema>>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: defaultEditorContent,
      excerpt: "",
      coverImage: "",
      type: "review",
      published: false,
      restaurantInfo: {
        name: "",
        address: "",
        description: "",
        cuisine_type: "washoku",
        price_range: "moderate",
        latitude: 35.6812,
        longitude: 139.7671,
        phone: "",
        website: "",
      },
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createArticleSchema>) => {
      if (!user) throw new Error("認証が必要です");

      const articleData: InsertArticle = {
        ...data,
        authorId: user.id,
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

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    form.setValue("restaurantInfo.latitude", lat);
    form.setValue("restaurantInfo.longitude", lng);
  };

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
                  <TabsTrigger value="restaurant">レストラン情報</TabsTrigger>
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
                          onValueChange={field.onChange}
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

                <TabsContent value="restaurant" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="restaurantInfo.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>店名</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restaurantInfo.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>住所</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                // TODO: Implement address search
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restaurantInfo.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>店舗説明</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="restaurantInfo.cuisine_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>料理の種類</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="料理の種類を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="washoku">和食</SelectItem>
                              <SelectItem value="sushi">寿司</SelectItem>
                              <SelectItem value="ramen">ラーメン</SelectItem>
                              <SelectItem value="izakaya">居酒屋</SelectItem>
                              <SelectItem value="other">その他</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restaurantInfo.price_range"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>価格帯</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="価格帯を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="budget">予算friendly (£)</SelectItem>
                              <SelectItem value="moderate">普通 (££)</SelectItem>
                              <SelectItem value="expensive">高級 (£££)</SelectItem>
                              <SelectItem value="luxury">超高級 (££££)</SelectItem>
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
                      name="restaurantInfo.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>電話番号</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restaurantInfo.website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ウェブサイト</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel>位置情報</FormLabel>
                    <div className="h-[400px] rounded-lg border">
                      <RestaurantLocationPicker
                        onLocationSelect={handleLocationSelect}
                        defaultLocation={selectedLocation || { lat: 51.5074, lng: -0.1278 }}
                      />
                    </div>
                  </div>
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