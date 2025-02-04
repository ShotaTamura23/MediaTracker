import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Store,
  LayoutDashboard,
  Mail,
} from "lucide-react";

const menuItems = [
  {
    title: "ダッシュボード",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "記事管理",
    href: "/admin/articles",
    icon: BookOpen,
  },
  {
    title: "レストラン管理",
    href: "/admin/restaurants",
    icon: Store,
  },
  {
    title: "ニュースレター",
    href: "/admin/newsletter",
    icon: Mail,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-6">
            {menuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 py-4 text-sm font-medium transition-colors hover:text-primary",
                    isActive
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
}