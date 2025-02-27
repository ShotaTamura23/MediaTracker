import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export default function AdminLoginPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      const res = await apiRequest("POST", "/api/admin/login", data);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "ログインに失敗しました");
      }
      const user = await res.json();
      if (user.isAdmin) {
        window.location.href = "/admin"; // Force a full page reload
      } else {
        toast({
          title: "アクセス権限がありません",
          description: "管理者権限を持つユーザーのみログインできます",
          variant: "destructive",
        });
        form.reset();
      }
    } catch (error) {
      toast({
        title: "ログインに失敗しました",
        description: error instanceof Error ? error.message : "認証に失敗しました",
        variant: "destructive",
      });
    }
  };

  // If already logged in as admin, redirect to admin dashboard
  if (user?.isAdmin) {
    setLocation("/admin");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>管理者ログイン</CardTitle>
          <CardDescription>
            管理画面にアクセスするには管理者権限が必要です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ユーザー名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>パスワード</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                ログイン
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}