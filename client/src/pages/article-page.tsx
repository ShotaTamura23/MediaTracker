import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Share2 } from "lucide-react";
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
        title: "Article bookmarked",
        description: "You can find this article in your bookmarks.",
      });
    },
  });

  if (!article) return null;

  const handleShare = async () => {
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
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">
              {new Date(article.createdAt).toLocaleDateString()}
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

        <div className="aspect-video mb-8">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="prose prose-lg max-w-none">
          {/* Render the rich text content */}
          <div dangerouslySetInnerHTML={{ __html: article.content as string }} />
        </div>

        {article.type === "review" && (
          <Card className="mt-8 p-6">
            <h2 className="text-2xl font-semibold mb-4">Location</h2>
            <div className="h-[400px]">
              <RestaurantMap />
            </div>
          </Card>
        )}
      </article>
    </div>
  );
}
