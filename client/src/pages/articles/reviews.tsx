import { useQuery } from "@tanstack/react-query";
import { SelectArticle } from "@db/schema";
import ArticleCard from "@/components/article/article-card";
import { Card } from "@/components/ui/card";
import RestaurantMap from "@/components/maps/restaurant-map";

export default function ReviewsPage() {
  const { data: articles, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  const reviews = articles?.filter(article => article.type === "review") ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Restaurant Reviews</h1>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="space-y-6">
            {isLoading ? (
              <p>Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p>No reviews found.</p>
            ) : (
              reviews.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            )}
          </div>
        </div>
        
        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Featured Locations</h2>
            <div className="h-[600px]">
              <RestaurantMap />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
