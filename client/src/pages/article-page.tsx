import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, Share2, MapPin, Phone, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SelectArticle } from "@db/schema";
import { apiRequest } from "@/lib/queryClient";
import RestaurantMap from "@/components/maps/restaurant-map";

export default function ArticlePage() {
  const [, params] = useRoute("/article/:slug");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: article } = useQuery<SelectArticle>({
    queryKey: [`/api/articles/${params?.slug}`],
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!article) return;
      await apiRequest("POST", "/api/bookmarks", { articleId: article.id });
    },
    onSuccess: () => {
      toast({
        title: "記事をブックマークに追加しました",
        description: "マイページのブックマークから確認できます。",
      });
    },
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
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

  if (!article) return null;

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
            {article.content?.split('\n\n').map((section, index) => {
              if (section.startsWith('#')) {
                const [title, ...contentLines] = section.split('\n');
                const restaurantName = title.replace('# ', '');
                return (
                  <Card key={index} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Badge 
                          variant="outline" 
                          className="h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold"
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{restaurantName}</h2>
                          <div className="prose prose-lg max-w-none">
                            {contentLines.map((line, i) => (
                              <p key={i} className="mb-4">{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Add restaurant address here</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>Add phone number here</span>
                        </div>
                        <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                          <ExternalLink className="h-4 w-4" />
                          ウェブサイト
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              }
              return null;
            })}
          </div>

          <div className="lg:sticky lg:top-4 h-[calc(100vh-2rem)]">
            <Card className="h-full">
              <div className="p-4 h-full">
                <RestaurantMap />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </article>
  );
}