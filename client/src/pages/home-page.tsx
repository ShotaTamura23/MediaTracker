import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import ArticleCard from "@/components/article/article-card";
import RestaurantMap from "@/components/maps/restaurant-map";
import { SelectArticle } from "@db/schema";
import { Button } from "@/components/ui/button";
import { SiBookmyshow } from "react-icons/si";

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

  const featuredArticle = articles?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {featuredArticle && (
        <div className="relative bg-cover bg-center h-[80vh] min-h-[600px]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${featuredArticle.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative h-full container mx-auto px-4">
            <div className="flex flex-col justify-end h-full pb-16 max-w-2xl">
              <Link href={`/article/${featuredArticle.slug}`}>
                <div className="space-y-4 cursor-pointer group">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                    {featuredArticle.title}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {featuredArticle.excerpt}
                  </p>
                  <Button 
                    variant="secondary" 
                    className="group-hover:translate-x-2 transition-transform"
                  >
                    続きを読む
                    <span className="ml-2">→</span>
                  </Button>
                </div>
              </Link>
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
              {articles?.slice(1).map((article) => (
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