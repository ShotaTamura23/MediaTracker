import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";
import { useEffect } from "react";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('AdminRoute状態:', {
      isLoading,
      user,
      isAdmin: user?.isAdmin,
      path
    });

    if (!isLoading && (!user || !user.isAdmin)) {
      console.log('管理者権限がないため、リダイレクトします');
      setLocation("/");
    }
  }, [user, isLoading, setLocation, path]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user?.isAdmin) {
    console.log('管理者権限がありません');
    return null;
  }

  console.log('管理者としてレンダリングします');
  return <Route path={path} component={Component} />;
}