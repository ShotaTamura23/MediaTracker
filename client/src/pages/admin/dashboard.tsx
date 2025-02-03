import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  TrendingUp,
  Bookmark,
  Mail,
  PlusCircle,
  Settings,
  Store,
} from "lucide-react";
import { SelectArticle, SelectNewsletter } from "@db/schema";
import AdminLayout from "@/components/layout/admin-layout";

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: articles } = useQuery<SelectArticle[]>({
    queryKey: ["/api/articles"],
  });

  const { data: newsletters } = useQuery<SelectNewsletter[]>({
    queryKey: ["/api/newsletters"],
  });

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

  // Calculate stats
  const totalArticles = articles?.length || 0;
  const publishedArticles = articles?.filter((a) => a.published).length || 0;
  const subscriberCount = newsletters?.length || 0;

  // Prepare chart data
  const articlesByType = articles?.reduce((acc: any[], article) => {
    const existingType = acc.find((a) => a.type === article.type);
    if (existingType) {
      existingType.count++;
    } else {
      acc.push({ type: article.type, count: 1 });
    }
    return acc;
  }, []) || [];

  const stats = [
    {
      title: "総記事数",
      value: totalArticles,
      icon: BookOpen,
      className: "bg-blue-500",
    },
    {
      title: "公開済み",
      value: publishedArticles,
      icon: TrendingUp,
      className: "bg-green-500",
    },
    {
      title: "下書き",
      value: totalArticles - publishedArticles,
      icon: Bookmark,
      className: "bg-orange-500",
    },
    {
      title: "購読者数",
      value: subscriberCount,
      icon: Mail,
      className: "bg-purple-500",
    },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">管理画面</h1>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/admin/articles/create">
                <PlusCircle className="h-4 w-4 mr-2" />
                新規記事作成
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/articles">
                <Settings className="h-4 w-4 mr-2" />
                記事管理
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/restaurants">
                <Store className="h-4 w-4 mr-2" />
                レストラン管理
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon
                  className={`h-5 w-5 text-white p-1 rounded-full ${stat.className}`}
                />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>記事タイプの分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={articlesByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--primary)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の記事</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {articles?.slice(0, 5).map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          article.published
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {article.published ? "公開中" : "下書き"}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}