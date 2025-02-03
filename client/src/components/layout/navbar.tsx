import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="text-2xl font-bold p-0">日本食</Button>
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Button variant="ghost" asChild>
                <Link href="/articles/reviews">レビュー</Link>
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button variant="ghost" asChild>
                <Link href="/articles/guides">ガイド</Link>
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button variant="ghost" asChild>
                <Link href="/articles/openings">新着店舗</Link>
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button variant="ghost" asChild>
                <Link href="/restaurants">レストラン</Link>
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">管理画面</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/bookmarks">ブックマーク</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default">
              <Link href="/auth">ログイン</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}