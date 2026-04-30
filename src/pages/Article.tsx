import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardNav from "@/components/DashboardNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  category: string | null;
  tags: string[] | null;
  read_time: number;
  created_at: string;
}

const Article = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (error) throw error;
        setArticle(data);
      } catch (error) {
        console.error("Error fetching article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <p>Article not found</p>
          <Button onClick={() => navigate("/articles")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/articles")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Button>

        <Card>
          <CardContent className="p-8">
            {article.featured_image_url && (
              <img
                src={article.featured_image_url}
                alt={article.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{article.read_time} min read</span>
                {article.category && (
                  <Badge variant="outline" className="ml-2">
                    {article.category}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold">{article.title}</h1>

              {article.excerpt && (
                <p className="text-xl text-muted-foreground">{article.excerpt}</p>
              )}

              {article.tags && article.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div 
                className="prose prose-lg max-w-none mt-8"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Article;