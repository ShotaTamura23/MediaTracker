import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
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
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { SelectArticle } from "@db/schema";
import AdminLayout from "@/components/layout/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminArticles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: articles } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (articleId: number) => {
      const res = await apiRequest("DELETE", `/api/articles/${articleId}`);
      if (!res.ok) {
        throw new Error("記事の削除に失敗しました");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "記事を削除しました",
        description: "記事が正常に削除されました。",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <AdminLayout>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <Link href={`/admin/articles/edit/${article.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              この操作は取り消せません。記事は完全に削除されます。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(article.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}