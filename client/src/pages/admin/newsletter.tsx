import { useQuery } from "@tanstack/react-query";
import { SelectNewsletter } from "@db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

export default function NewsletterPage() {
  const { data: subscribers, isLoading } = useQuery<SelectNewsletter[]>({
    queryKey: ["/api/newsletters"],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const confirmedCount = subscribers?.filter(s => s.confirmed).length ?? 0;
  const totalCount = subscribers?.length ?? 0;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  総登録数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground">
                  メールアドレス登録総数
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  確認済み
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedCount}</div>
                <p className="text-xs text-muted-foreground">
                  メール確認済みの登録数
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  確認率
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  メール確認完了率
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>登録者一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>登録日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers?.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell>{subscriber.email}</TableCell>
                      <TableCell>
                        <Badge variant={subscriber.confirmed ? "default" : "secondary"}>
                          {subscriber.confirmed ? "確認済み" : "未確認"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(subscriber.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
