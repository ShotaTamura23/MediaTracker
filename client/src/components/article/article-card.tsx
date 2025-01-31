import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SelectArticle } from "@db/schema";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  article: SelectArticle;
  isBookmarked?: boolean;
}

export default function ArticleCard({ article, isBookmarked }: ArticleCardProps) {
  const { user } = useAuth();

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${article.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { articleId: article.id });
      }
    },
  });

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[16/9]">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={() => bookmarkMutation.mutate()}
          >
            <Bookmark
              className={cn(
                "h-5 w-5",
                isBookmarked && "fill-current"
              )}
            />
          </Button>
        )}
      </div>
      <CardContent className="p-4">
        <Link href={`/article/${article.slug}`}>
          <h3 className="text-xl font-semibold mb-2 hover:text-primary cursor-pointer">
            {article.title}
          </h3>
        </Link>
        <p className="text-muted-foreground line-clamp-2">{article.excerpt}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            {new Date(article.createdAt).toLocaleDateString()}
          </span>
          <span className="text-sm font-medium capitalize">{article.type}</span>
        </div>
      </CardContent>
    </Card>
  );
}
