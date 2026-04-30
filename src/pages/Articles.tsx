import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Clock, Package, Lightbulb, Recycle, Users, Plus, Edit, Leaf } from "lucide-react";
import { toast } from "sonner";
import DashboardNav from "@/components/DashboardNav";
import { useUserRole } from "@/hooks/useUserRole";
import { ArticlesManagerWithEditor } from "@/components/dashboard/ArticlesManagerWithEditor";
import { Logo } from "@/components/Logo";

const Articles = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching articles:", error);
      } else {
        setArticles(data || []);
      }
    };

    fetchArticles();
  }, [showEditor]); // Refetch when toggling editor

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const getIconForCategory = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case "organizing":
        return Lightbulb;
      case "depreciation":
        return Package;
      case "community":
        return Users;
      case "sustainability":
        return Recycle;
      default:
        return Package;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          {user && (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </header>

      {/* Navigation */}
      {user && <DashboardNav />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {showEditor && isAdmin ? (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setShowEditor(false)}
              className="mb-4"
            >
              ← Back to Articles
            </Button>
            <ArticlesManagerWithEditor />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Learn Some Cool Stuff 📚</h2>
                <p className="text-muted-foreground">
                  Tips on organizing, sharing, and living more sustainably
                </p>
              </div>
              {isAdmin && (
                <Button onClick={() => setShowEditor(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Articles
                </Button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {articles.length === 0 ? (
                <p className="text-muted-foreground col-span-2">Nothing here yet. Check back soon!</p>
              ) : (
                articles.map((article) => {
                  const Icon = getIconForCategory(article.category);
                  return (
                    <Card 
                      key={article.id} 
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-eco flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2">{article.title}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>{article.read_time} min read</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{article.excerpt}</p>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="link" 
                            className="p-0"
                            onClick={() => navigate(`/articles/${article.slug}`)}
                          >
                            Read it →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Articles;
