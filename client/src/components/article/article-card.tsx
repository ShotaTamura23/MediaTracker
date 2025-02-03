import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SelectArticle } from "@db/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import TipTapEditor from "@/components/editor/tiptap-editor";

interface ArticleCardProps {
  article: SelectArticle & {
    restaurants?: Array<{
      name: string;
      cuisine_type: string;
      price_range: string;
      description?: string;
      status?: string;
    }>;
  };
  isBookmarked?: boolean;
  showContent?: boolean;
}

export default function ArticleCard({ article, isBookmarked, showContent = false }: ArticleCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${article.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { articleId: article.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: isBookmarked ? "ブックマークを解除しました" : "ブックマークに追加しました",
        description: isBookmarked ? "記事のブックマークを解除しました" : "記事をブックマークに保存しました",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "ブックマークの操作に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const getRestaurantText = () => {
    if (!article.restaurants?.length) return null;
    if (article.type === "review") {
      return article.restaurants[0].name;
    }
    return `${article.restaurants.length}件のレストラン`;
  };

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
            onClick={(e) => {
              e.preventDefault(); // Prevent link click when clicking bookmark button
              !bookmarkMutation.isPending && bookmarkMutation.mutate();
            }}
            disabled={bookmarkMutation.isPending}
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
          <a className="block">
            <h3 className="text-xl font-semibold mb-2 hover:text-primary">
              {article.title}
            </h3>
            <p className="text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
            {showContent && article.content && (
              <div className="mb-4 prose prose-sm max-w-none">
                <TipTapEditor content={article.content} editable={false} />
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(article.createdAt).toLocaleDateString()}
                </span>
                {getRestaurantText() && (
                  <Badge variant="secondary" className="text-xs">
                    {getRestaurantText()}
                  </Badge>
                )}
              </div>
              <Badge className="capitalize">
                {article.type === "review" ? "レビュー" : "リスト"}
              </Badge>
            </div>
          </a>
        </Link>
      </CardContent>
    </Card>
  );
}