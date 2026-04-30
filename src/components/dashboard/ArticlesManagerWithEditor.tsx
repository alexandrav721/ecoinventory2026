import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// Comprehensive list of formats to preserve when editing
const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script', 'align', 'direction',
  'list', 'bullet', 'indent',
  'link', 'image', 'video', 'formula',
  'blockquote', 'code-block'
];

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  status: string;
  category: string | null;
  tags: string[] | null;
  read_time: number;
  created_at: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    ["link", "image", "video"],
    ["blockquote", "code-block"],
    ["clean"],
  ],
  clipboard: {
    matchVisual: false,
  }
};

// Formats to preserve when editing
const editorFormats = formats;

export const ArticlesManagerWithEditor = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image_url: "",
    status: "draft",
    category: "",
    tags: "",
    read_time: 5,
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      toast.error("Failed to load articles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const articleData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        author_id: user.id,
      };

      if (editing) {
        const { error } = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", editing);

        if (error) throw error;
        toast.success("Article updated successfully");
      } else {
        const { error } = await supabase
          .from("articles")
          .insert([articleData]);

        if (error) throw error;
        toast.success("Article created successfully");
      }

      resetForm();
      fetchArticles();
    } catch (error: any) {
      toast.error("Failed to save article: " + error.message);
    }
  };

  const handleEdit = (article: Article) => {
    setEditing(article.id);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || "",
      content: article.content,
      featured_image_url: article.featured_image_url || "",
      status: article.status,
      category: article.category || "",
      tags: article.tags?.join(", ") || "",
      read_time: article.read_time,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Article deleted successfully");
      fetchArticles();
    } catch (error: any) {
      toast.error("Failed to delete article: " + error.message);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setShowPreview(false);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featured_image_url: "",
      status: "draft",
      category: "",
      tags: "",
      read_time: 5,
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading) return <div>Loading articles...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editing ? "Edit Article" : "Create New Article"}</span>
            {editing && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile/Tablet: Tabs View */}
            <div className="lg:hidden">
              <Tabs value={showPreview ? "preview" : "edit"} onValueChange={(v) => setShowPreview(v === "preview")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="edit" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setFormData({ 
                            ...formData, 
                            title: newTitle,
                            slug: !editing ? generateSlug(newTitle) : formData.slug
                          });
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug (URL)</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Excerpt</Label>
                    <Textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content</Label>
                    <div className="border rounded-md">
                      <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={(value) => setFormData({ ...formData, content: value })}
                        modules={modules}
                        formats={formats}
                        className="min-h-[300px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Featured Image URL</Label>
                      <Input
                        value={formData.featured_image_url}
                        onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Read Time (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.read_time}
                        onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Sustainability"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tags (comma-separated)</Label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="eco, tips, guide"
                      />
                    </div>
                  </div>
                </TabsContent>
              
                <TabsContent value="preview" className="mt-6">
                  <Card>
                    <CardContent className="p-8">
                      {formData.featured_image_url && (
                        <img
                          src={formData.featured_image_url}
                          alt={formData.title}
                          className="w-full h-64 object-cover rounded-lg mb-6"
                        />
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formData.read_time} min read</span>
                          {formData.category && (
                            <Badge variant="outline" className="ml-2">
                              {formData.category}
                            </Badge>
                          )}
                        </div>

                        <h1 className="text-4xl font-bold">{formData.title || "Untitled Article"}</h1>

                        {formData.excerpt && (
                          <p className="text-xl text-muted-foreground">{formData.excerpt}</p>
                        )}

                        {formData.tags && formData.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {formData.tags.split(",").map((tag) => (
                              <Badge key={tag.trim()} variant="secondary">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div 
                          className="prose prose-lg max-w-none mt-8"
                          dangerouslySetInnerHTML={{ __html: formData.content || "<p>No content yet...</p>" }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop: Side-by-Side View */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
              {/* Left: Editor */}
              <div className="space-y-4 overflow-y-auto max-h-[800px] pr-2">
                <h3 className="font-semibold text-lg sticky top-0 bg-card py-2">Editor</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setFormData({ 
                          ...formData, 
                          title: newTitle,
                          slug: !editing ? generateSlug(newTitle) : formData.slug
                        });
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Excerpt</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <div className="border rounded-md">
                    <ReactQuill
                      theme="snow"
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      modules={modules}
                      formats={formats}
                      className="min-h-[400px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Featured Image URL</Label>
                    <Input
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Read Time (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.read_time}
                      onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Sustainability"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="eco, tips, guide"
                    />
                  </div>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="space-y-4 overflow-y-auto max-h-[800px]">
                <h3 className="font-semibold text-lg sticky top-0 bg-card py-2">Live Preview</h3>
                <Card className="border-2">
                  <CardContent className="p-8">
                    {formData.featured_image_url && (
                      <img
                        src={formData.featured_image_url}
                        alt={formData.title}
                        className="w-full h-64 object-cover rounded-lg mb-6"
                      />
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formData.read_time} min read</span>
                        {formData.category && (
                          <Badge variant="outline" className="ml-2">
                            {formData.category}
                          </Badge>
                        )}
                      </div>

                      <h1 className="text-4xl font-bold">{formData.title || "Untitled Article"}</h1>

                      {formData.excerpt && (
                        <p className="text-xl text-muted-foreground">{formData.excerpt}</p>
                      )}

                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {formData.tags.split(",").map((tag) => (
                            <Badge key={tag.trim()} variant="secondary">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div 
                        className="prose prose-lg max-w-none mt-8"
                        dangerouslySetInnerHTML={{ __html: formData.content || "<p>No content yet...</p>" }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4">
              <Save className="w-4 h-4 mr-2" />
              {editing ? "Update Article" : "Create Article"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{article.title}</h3>
                    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={article.status === "published" ? "default" : "secondary"}>
                        {article.status}
                      </Badge>
                      {article.category && <Badge variant="outline">{article.category}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(article)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};