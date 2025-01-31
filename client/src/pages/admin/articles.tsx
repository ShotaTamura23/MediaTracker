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
import { PlusCircle } from "lucide-react";
import { SelectArticle } from "@db/schema";
import { useState } from "react";


export default function AdminArticles() {
  const { user } = useAuth();
  const { data: articles } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

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

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>タイプ</TableHead>
              <TableHead>状態</TableHead>
              <TableHead>作成日</TableHead>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}