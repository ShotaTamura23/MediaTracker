import { useQuery, useMutation } from "@tanstack/react-query";
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">{article.title}</h1>
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

      <div className="text-xl text-muted-foreground mb-8">{article.excerpt}</div>

      {article.type === "review" && (
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          <div className="space-y-6">
            {article.content.split('\n\n').map((section, index) => {
              if (section.startsWith('#')) {
                // This is a restaurant entry
                const [title, ...content] = section.split('\n');
                const restaurantNumber = index + 1;
                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Badge variant="outline" className="mb-2">#{restaurantNumber}</Badge>
                          <h3 className="text-2xl font-bold">{title.replace('# ', '')}</h3>
                        </div>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        {content.map((line, i) => (
                          <p key={i} className="mb-4">{line}</p>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>Location info will be here</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>Phone info will be here</span>
                        </div>
                        <a href="#" className="flex items-center gap-1 text-primary hover:underline">
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
              <div className="h-full p-4">
                <RestaurantMap />
              </div>
            </Card>
          </div>
        </div>
      )}

      {article.type !== "review" && (
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content as string }} />
        </div>
      )}
    </div>
  );
}