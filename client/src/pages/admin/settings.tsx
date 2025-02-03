import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettings() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">設定</h1>
        <Card>
          <CardHeader>
            <CardTitle>アプリケーション設定</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">設定項目はまだありません。</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
