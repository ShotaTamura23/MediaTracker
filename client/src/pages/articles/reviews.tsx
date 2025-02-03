import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SelectArticle } from "@db/schema";
import ArticleCard from "@/components/article/article-card";
import { Card } from "@/components/ui/card";
import RestaurantMap from "@/components/maps/restaurant-map";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 6;

export default function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: articles, isLoading } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  // Filter only published review articles
  const reviews = articles?.filter(
    article => article.type === "review" && article.published
  ) ?? [];
  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);

  // Get current page's articles
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentReviews = reviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Get restaurants from current page's articles
  const currentRestaurants = currentReviews
    .flatMap(article => article.restaurants || [])
    .filter(restaurant => restaurant.status !== "deleted");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">レストランレビュー</h1>

      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-muted-foreground">レビュー記事はまだありません。</p>
          ) : (
            <>
              <div className="grid gap-6">
                {currentReviews.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.max(1, p - 1));
                          }}
                          aria-disabled={currentPage === 1}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.min(totalPages, p + 1));
                          }}
                          aria-disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="p-4">
            <h2 className="text-2xl font-semibold mb-4">掲載レストラン</h2>
            <div className="h-[600px]">
              <RestaurantMap restaurants={currentRestaurants} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}