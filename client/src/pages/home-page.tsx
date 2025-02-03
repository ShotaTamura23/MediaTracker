import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import ArticleCard from "@/components/article/article-card";
import RestaurantMap from "@/components/maps/restaurant-map";
import { SelectArticle } from "@db/schema";
import { Button } from "@/components/ui/button";
import { SiBookmyshow } from "react-icons/si";
import { Share2 } from "lucide-react";

export default function HomePage() {
  const { data: articles, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  // Filter published articles only
  const publishedArticles = articles?.filter(article => article.published) || [];
  const featuredArticle = publishedArticles[0];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: featuredArticle?.title,
          text: featuredArticle?.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {featuredArticle && (
        <div className="relative min-h-[90vh] flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${featuredArticle.coverImage})`,
            }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white space-y-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                {featuredArticle.title}
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto">
                {featuredArticle.excerpt}
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link href={`/article/${featuredArticle.slug}`}>
                  <Button size="lg" className="px-8">
                    記事を読む
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                  className="bg-white/10 hover:bg-white/20"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-[1fr,400px] gap-12">
          {/* Articles Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">最新の記事</h2>
              <Link href="/articles">
                <Button variant="ghost">
                  すべての記事を見る
                  <span className="ml-2">→</span>
                </Button>
              </Link>
            </div>
            <div className="grid gap-8">
              {publishedArticles.slice(1).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>

          {/* Map Section */}
          <div className="lg:sticky lg:top-4 space-y-8">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <SiBookmyshow className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">ロンドンの日本食</h2>
                </div>
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <RestaurantMap />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}