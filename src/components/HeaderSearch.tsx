import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const HeaderSearch = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/community?q=${encodeURIComponent(term)}` : "/community");
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full hidden md:block">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the community…"
        className="h-9 pl-10 pr-4 rounded-full bg-secondary/60 border-transparent focus-visible:bg-background focus-visible:border-foreground/20 text-sm"
      />
    </form>
  );
};
