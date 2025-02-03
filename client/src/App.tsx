import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/admin-route";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import HomePage from "./pages/home-page";
import ArticlePage from "./pages/article-page";
import ReviewsPage from "./pages/articles/reviews";
import GuidesPage from "./pages/articles/guides";
import RestaurantsPage from "./pages/restaurants";
import AuthPage from "./pages/auth-page";
import AdminDashboard from "./pages/admin/dashboard";
import AdminArticles from "./pages/admin/articles";
import AdminRestaurants from "./pages/admin/restaurants";
import CreateArticle from "./pages/admin/articles/create";
import EditArticle from "./pages/admin/articles/edit";
import AdminLoginPage from "./pages/admin/login";
import BookmarksPage from "./pages/bookmarks";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/article/:slug" component={ArticlePage} />
      <Route path="/articles/reviews" component={ReviewsPage} />
      <Route path="/articles/guides" component={GuidesPage} />
      <Route path="/restaurants" component={RestaurantsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <ProtectedRoute path="/bookmarks" component={BookmarksPage} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/articles" component={AdminArticles} />
      <AdminRoute path="/admin/restaurants" component={AdminRestaurants} />
      <AdminRoute path="/admin/articles/create" component={CreateArticle} />
      <AdminRoute path="/admin/articles/edit/:id" component={EditArticle} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;