import { useQuery } from "@tanstack/react-query";
import { SelectArticle } from "@db/schema";
import ArticleCard from "@/components/article/article-card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface BookmarkResponse {
  article: SelectArticle;
}

export default function BookmarksPage() {
  const { user } = useAuth();
  
  const { data: bookmarks, isLoading } = useQuery<BookmarkResponse[]>({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Bookmarks</h1>
      
      {bookmarks?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">You haven't bookmarked any articles yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks?.map(({ article }) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              isBookmarked={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
