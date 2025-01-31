import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { SelectArticle } from "@db/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import ArticleEditor from "@/components/article/editor";
import { useToast } from "@/hooks/use-toast";

export default function AdminArticles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedArticle, setSelectedArticle] = useState<SelectArticle | null>(
    null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { data: articles } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Article deleted",
        description: "The article has been successfully deleted.",
      });
    },
  });

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Articles</h1>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedArticle(null)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {selectedArticle ? "Edit Article" : "New Article"}
              </DialogTitle>
            </DialogHeader>
            <ArticleEditor
              article={selectedArticle}
              onClose={() => {
                setIsEditorOpen(false);
                setSelectedArticle(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
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
                    {article.published ? "Published" : "Draft"}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(article.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedArticle(article);
                        setIsEditorOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this article?"
                          )
                        ) {
                          deleteMutation.mutate(article.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
