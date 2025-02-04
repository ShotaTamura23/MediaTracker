import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Share2, MapPin, Phone, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SelectArticle } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
import RestaurantMap from "@/components/maps/restaurant-map";
import { cn } from "@/lib/utils";
import TipTapEditor from "@/components/editor/tiptap-editor";

export default function ArticlePage() {
  const [, params] = useRoute("/article/:slug");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery<SelectArticle>({
    queryKey: [`/api/articles/${params?.slug}`],
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!article) return;
      await apiRequest("POST", "/api/bookmarks", { articleId: article.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "記事をブックマークに追加しました",
        description: "マイページのブックマークから確認できます。",
      });
    },
  });

  const handleShare = async () => {
    if (!article) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "リンクをコピーしました",
        description: "記事のURLをクリップボードにコピーしました",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If article is not found, redirect to 404
  if (!article) {
    setLocation("/not-found");
    return null;
  }

  // If article is not published and user is not admin, redirect to 404
  if (!article.published && !user?.isAdmin) {
    setLocation("/not-found");
    return null;
  }

  // JSONコンテンツの解析処理を修正
  const content = typeof article.content === 'string'
    ? JSON.parse(article.content)
    : article.content;

  // Restaurant information card component
  const RestaurantInfo = ({ restaurant }: { restaurant: any }) => (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{restaurant.name}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Badge>{restaurant.cuisine_type}</Badge>
          <Badge variant="outline">{restaurant.price_range}</Badge>
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="text-base text-foreground">{restaurant.description}</p>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{restaurant.address}</span>
        </div>

        {restaurant.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{restaurant.phone}</span>
          </div>
        )}

        {restaurant.website && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ウェブサイトを開く
            </a>
          </div>
        )}
      </div>
    </div>
  );

  // For list-type articles, show restaurants with map
  if (article.type === 'list' && article.restaurants) {
    return (
      <article className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
                <p className="text-xl text-muted-foreground">{article.excerpt}</p>
              </div>
              <div className="flex gap-2">
                {user && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => bookmarkMutation.mutate()}
                    disabled={bookmarkMutation.isPending}
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-[1fr,400px] gap-8">
            <div className="space-y-6">
              {/* Add article content section */}
              <Card className="p-6">
                <div className="prose prose-lg max-w-none">
                  <TipTapEditor 
                    content={content}
                    editable={false}
                  />
                </div>
              </Card>

              {article.restaurants.map((restaurant, index) => (
                <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <RestaurantInfo restaurant={restaurant} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:sticky lg:top-4 h-[calc(100vh-2rem)]">
              <Card className="h-full">
                <div className="p-4 h-full">
                  <RestaurantMap restaurants={article.restaurants} />
                </div>
              </Card>
            </div>
          </div>
        </main>
      </article>
    );
  }

  // For essay and review type articles
  return (
    <article className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {article.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {article.excerpt}
          </p>
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          <div className="max-w-3xl py-12">
            <div className="flex items-center gap-4 mb-12">
              {user && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* レストラン情報（レビュー記事の場合） */}
            {article.type === 'review' && article.restaurants && article.restaurants[0] && (
              <Card className="mb-8 p-6">
                <h2 className="text-2xl font-bold mb-4">レビュー対象店舗</h2>
                <RestaurantInfo restaurant={article.restaurants[0]} />
              </Card>
            )}

            {/* 記事本文の表示部分を修正 */}
            <div className="prose prose-lg max-w-none">
              <TipTapEditor 
                content={content}
                editable={false}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-4 h-[calc(100vh-2rem)]">
            <Card className="h-full">
              <div className="p-4 h-full">
                <RestaurantMap restaurants={article.restaurants} />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </article>
  );
}