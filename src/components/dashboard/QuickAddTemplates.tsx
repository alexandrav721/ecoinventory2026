import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Utensils, Shirt, Laptop, Sofa, Wrench, 
  Gamepad2, Book, Dumbbell, Plus
} from "lucide-react";

const templates = [
  { icon: Utensils, label: "Kitchen", category: "Kitchen" },
  { icon: Shirt, label: "Clothing", category: "Clothing" },
  { icon: Laptop, label: "Electronics", category: "Electronics" },
  { icon: Sofa, label: "Furniture", category: "Furniture" },
  { icon: Wrench, label: "Tools", category: "Tools & Hardware" },
  { icon: Gamepad2, label: "Gaming", category: "Entertainment" },
  { icon: Book, label: "Books", category: "Books & Media" },
  { icon: Dumbbell, label: "Sports", category: "Sports & Outdoors" },
];

const QuickAddTemplates = () => {
  const navigate = useNavigate();

  const handleQuickAdd = (categoryName: string) => {
    navigate("/dashboard/add-item", { 
      state: { preselectedCategory: categoryName } 
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-sm text-muted-foreground self-center mr-1">Quick add:</span>
      {templates.map((template) => (
        <Button
          key={template.label}
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs hover:bg-primary/5 hover:border-primary/30 transition-colors"
          onClick={() => handleQuickAdd(template.category)}
        >
          <template.icon className="w-3.5 h-3.5" />
          {template.label}
        </Button>
      ))}
      <Button
        variant="default"
        size="sm"
        className="gap-1.5 h-8 text-xs"
        onClick={() => window.dispatchEvent(new CustomEvent("open-add-item-modal"))}
      >
        <Plus className="w-3.5 h-3.5" />
        Other
      </Button>
    </div>
  );
};

export default QuickAddTemplates;
