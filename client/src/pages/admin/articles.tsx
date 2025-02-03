import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit2 } from "lucide-react";
import { SelectArticle } from "@db/schema";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ArticleEditor from "@/components/article/editor";

export default function AdminArticles() {
  const { user } = useAuth();
  const { data: articles } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });
  const [editingArticle, setEditingArticle] = useState<SelectArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

  const handleEditArticle = (article: SelectArticle) => {
    setEditingArticle(article);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingArticle(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">記事管理</h1>
        <Button asChild>
          <Link href="/admin/articles/create">
            <PlusCircle className="h-4 w-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>記事を編集</DialogTitle>
          </DialogHeader>
          <ArticleEditor article={editingArticle} onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>タイプ</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles?.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell className="capitalize">{article.type}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      article.published
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {article.published ? "公開" : "下書き"}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(article.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditArticle(article)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}