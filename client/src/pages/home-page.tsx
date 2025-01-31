import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import ArticleCard from "@/components/article/article-card";
import RestaurantMap from "@/components/maps/restaurant-map";
import { SelectArticle } from "@db/schema";

export default function HomePage() {
  const { data: articles, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const featuredArticle = articles?.[0];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      {featuredArticle && (
        <Link href={`/article/${featuredArticle.slug}`}>
          <div 
            className="relative h-[60vh] rounded-lg overflow-hidden mb-12 cursor-pointer group"
            style={{
              backgroundImage: `url(${featuredArticle.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors" />
            <div className="absolute bottom-0 left-0 p-8">
              <div className="text-white">
                <p className="text-sm uppercase tracking-wider mb-2">Featured Article</p>
                <h1 className="text-4xl font-bold mb-4">{featuredArticle.title}</h1>
                <p className="text-lg">{featuredArticle.excerpt}</p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-6">Latest Articles</h2>
          <div className="space-y-6">
            {articles?.slice(1).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
        
        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Featured Restaurants</h2>
            <div className="h-[600px]">
              <RestaurantMap />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
