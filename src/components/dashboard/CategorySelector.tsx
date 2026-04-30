import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
}

interface CategorySelectorProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  itemName?: string;
  onFeedback?: (feedbackData: {
    itemName: string;
    suggestedCategoryId: string | null;
    actualCategoryId: string | null;
    feedbackType: 'incorrect' | 'helpful' | 'no_suggestion';
  }) => void;
}

export function CategorySelector({ value, onChange, itemName = "", onFeedback }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestionReasoning, setAiSuggestionReasoning] = useState<string>("");

  useEffect(() => {
    loadCategories();
  }, []);

  // Auto-suggest category based on item name (using catalog + keywords, no AI)
  useEffect(() => {
    // Only suggest if we have an item name and no category is set yet
    if (!itemName || itemName.length < 3) return;
    
    // Don't re-suggest if user already made a choice
    if (value && suggestedCategory === value) return;

    const suggest = async () => {
      const name = itemName.toLowerCase().trim();
      
      console.log('[CategorySelector] Suggesting category for:', name);
      
      // Step 1: Check product catalog for exact or similar matches
      const { data: catalogMatches } = await supabase
        .from('product_catalog')
        .select('name, category_id')
        .ilike('name', `%${name}%`)
        .limit(5);
      
      if (catalogMatches && catalogMatches.length > 0) {
        // Find the best match from catalog
        const exactMatch = catalogMatches.find(p => 
          p.name.toLowerCase() === name || 
          p.name.toLowerCase().includes(name) ||
          name.includes(p.name.toLowerCase())
        );
        
        const matchedCategoryId = exactMatch?.category_id || catalogMatches[0].category_id;
        
        if (matchedCategoryId) {
          const category = categories.find(c => c.id === matchedCategoryId);
          console.log('[CategorySelector] Found catalog match:', category);
          
          if (category) {
            if (category.parent_id) {
              // It's a subcategory
              setSelectedParent(category.parent_id);
              loadSubCategories(category.parent_id);
              setSuggestedCategory(matchedCategoryId);
              onChange(matchedCategoryId);
            } else {
              // It's a parent category
              setSuggestedCategory(matchedCategoryId);
              setSelectedParent(matchedCategoryId);
              loadSubCategories(matchedCategoryId);
            }
            return;
          }
        }
      }
      
      // Step 2: Expanded keyword matching system
      console.log('[CategorySelector] No catalog match, trying keyword matching');
      // Comprehensive keyword database (no AI needed)
      const categoryKeywords: Record<string, string[]> = {
        "Clothing & Accessories": [
          "shirt", "t-shirt", "tshirt", "blouse", "top", "pants", "trousers", "jeans", "denim",
          "dress", "gown", "skirt", "jacket", "coat", "blazer", "sweater", "cardigan", "hoodie",
          "shorts", "leggings", "tights", "underwear", "bra", "socks", "stockings",
          "pajamas", "pyjamas", "pjs", "sleepwear", "nightwear", "nightgown", "robe", "bathrobe",
          "shoes", "boots", "sneakers", "trainers", "sandals", "heels", "flats", "slippers",
          "hat", "cap", "beanie", "scarf", "gloves", "mittens", "belt", "tie", "bowtie",
          "watch", "jewelry", "necklace", "bracelet", "ring", "earrings", "sunglasses", "glasses",
          "bag", "purse", "backpack", "wallet", "handbag"
        ],
        "Kitchen & Dining": [
          "pot", "pan", "skillet", "wok", "saucepan", "frying pan",
          "plate", "dish", "bowl", "cup", "mug", "glass", "tumbler",
          "fork", "knife", "spoon", "cutlery", "utensil", "spatula", "ladle", "whisk", "tongs",
          "blender", "mixer", "food processor", "toaster", "kettle", "coffee maker", "espresso",
          "microwave", "oven", "stove", "cooker", "air fryer", "pressure cooker", "slow cooker",
          "cutting board", "chopping board", "grater", "peeler", "can opener", "colander", "strainer",
          "baking", "cake", "cookie sheet", "muffin tin", "casserole"
        ],
        "Electronics & Tech": [
          "phone", "iphone", "android", "smartphone", "mobile", "cell phone",
          "laptop", "macbook", "computer", "pc", "desktop", "imac",
          "tablet", "ipad", "kindle", "e-reader",
          "camera", "dslr", "gopro", "camcorder", "lens",
          "headphone", "earbuds", "airpods", "headset",
          "speaker", "bluetooth", "soundbar", "alexa", "echo", "google home",
          "charger", "cable", "usb", "adapter", "power bank",
          "mouse", "keyboard", "webcam", "microphone",
          "monitor", "display", "screen", "tv", "television", "smart tv",
          "router", "modem", "wifi", "hard drive", "ssd", "usb drive", "flash drive",
          "console", "playstation", "xbox", "nintendo", "switch", "gaming"
        ],
        "Home & Furniture": [
          "chair", "armchair", "recliner", "stool", "bench",
          "table", "dining table", "coffee table", "desk", "workstation",
          "sofa", "couch", "loveseat", "sectional", "futon",
          "bed", "mattress", "box spring", "bed frame", "bunk bed",
          "dresser", "nightstand", "wardrobe", "closet", "cabinet", "drawer", "chest",
          "shelf", "bookshelf", "bookcase", "shelving unit",
          "lamp", "floor lamp", "table lamp", "light", "chandelier", "ceiling light",
          "mirror", "picture frame", "wall art", "decoration",
          "rug", "carpet", "mat", "curtain", "blinds", "drapes",
          "pillow", "cushion", "blanket", "throw", "comforter", "duvet", "sheet"
        ],
        "Books & Media": [
          "book", "novel", "textbook", "cookbook", "workbook", "journal", "diary",
          "magazine", "comic", "manga", "graphic novel",
          "dvd", "blu-ray", "cd", "vinyl", "record", "cassette", "tape"
        ],
        "Sports & Outdoors": [
          "bike", "bicycle", "cycling", "mountain bike", "road bike",
          "ball", "soccer ball", "basketball", "football", "tennis ball", "volleyball",
          "racket", "tennis racket", "badminton", "squash",
          "golf", "golf club", "putter", "driver",
          "yoga", "yoga mat", "fitness", "exercise", "workout", "gym",
          "weights", "dumbbell", "barbell", "kettlebell",
          "camping", "tent", "sleeping bag", "backpack", "hiking",
          "skateboard", "scooter", "rollerblade", "skates",
          "fishing", "rod", "reel", "tackle"
        ],
        "Health & Beauty": [
          "makeup", "cosmetics", "lipstick", "mascara", "foundation", "concealer", "blush",
          "skincare", "moisturizer", "lotion", "cream", "serum", "cleanser", "toner",
          "shampoo", "conditioner", "hair", "hairdryer", "straightener", "curling iron",
          "perfume", "cologne", "fragrance", "deodorant",
          "razor", "shaver", "trimmer", "grooming",
          "nail", "nail polish", "manicure", "pedicure",
          "toothbrush", "toothpaste", "dental", "floss"
        ],
        "Tools & Hardware": [
          "hammer", "screwdriver", "drill", "power drill", "impact driver",
          "wrench", "socket", "ratchet", "pliers", "vice grip",
          "saw", "circular saw", "jigsaw", "handsaw",
          "nail", "screw", "bolt", "nut", "anchor",
          "toolbox", "tool chest", "tool bag",
          "ladder", "step ladder", "extension ladder",
          "level", "tape measure", "measuring tape",
          "paint", "brush", "roller", "sandpaper"
        ],
        "Toys & Games": [
          "toy", "doll", "barbie", "action figure", "figurine",
          "puzzle", "jigsaw puzzle",
          "lego", "blocks", "building blocks", "construction",
          "board game", "card game", "monopoly", "chess", "checkers",
          "video game", "game", "playstation", "xbox", "nintendo", "switch",
          "stuffed animal", "plush", "teddy bear",
          "remote control", "rc car", "drone"
        ],
        "Office & Stationery": [
          "pen", "pencil", "marker", "highlighter", "crayon",
          "notebook", "notepad", "journal", "planner", "organizer",
          "paper", "printer paper", "cardstock",
          "stapler", "staples", "paper clips", "binder clips",
          "folder", "binder", "file", "filing",
          "calculator", "adding machine",
          "desk organizer", "pen holder", "tray",
          "scissors", "tape", "glue", "adhesive",
          "printer", "scanner", "copier", "ink", "toner"
        ]
      };

      // Find matching parent category
      let foundKeywordMatch = false;
      for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => name.includes(keyword))) {
          const parentCat = categories.find(c => c.name === categoryName && !c.parent_id);
          if (parentCat) {
            console.log('[CategorySelector] Keyword match found:', categoryName, 'for item:', name);
            setSuggestedCategory(parentCat.id);
            setSelectedParent(parentCat.id);
            loadSubCategories(parentCat.id);
            foundKeywordMatch = true;
            break;
          }
        }
      }
      
      // Step 3: If no keyword match, try AI-powered suggestion using product mappings
      if (!foundKeywordMatch && !aiSuggesting) {
        console.log('[CategorySelector] No keyword match, trying AI suggestion');
        tryAISuggestion(name);
      }
    };

    if (categories.length > 0) {
      suggest();
    }
  }, [itemName, categories, value]);

  useEffect(() => {
    // When value changes, find and set the parent category
    if (value && categories.length > 0) {
      const selectedCat = categories.find((c) => c.id === value);
      if (selectedCat?.parent_id) {
        setSelectedParent(selectedCat.parent_id);
        loadSubCategories(selectedCat.parent_id);
      } else if (selectedCat && !selectedCat.parent_id) {
        // It's a parent category itself
        setSelectedParent(selectedCat.id);
        loadSubCategories(selectedCat.id);
      }
    }
  }, [value, categories]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading categories:", error);
      return;
    }

    setCategories(data || []);
    
    // Separate parent and child categories
    const parents = (data || []).filter((c) => c.parent_id === null);
    setParentCategories(parents);
  };

  const loadSubCategories = async (parentId: string) => {
    const subs = categories.filter((c) => c.parent_id === parentId);
    setSubCategories(subs);
  };

  const handleParentChange = (parentId: string) => {
    setSelectedParent(parentId);
    loadSubCategories(parentId);
    onChange(null); // Reset subcategory when parent changes
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    onChange(subCategoryId);
    
    // Show feedback prompt if a suggestion was made and user changed it
    if (suggestedCategory && suggestedCategory !== subCategoryId && !feedbackGiven) {
      setShowFeedback(true);
    }
  };

  const tryAISuggestion = async (itemName: string) => {
    setAiSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-category', {
        body: { itemName }
      });

      if (error) {
        // Silently fail for AI - don't show error toasts, just log
        console.log('[CategorySelector] AI suggestion failed:', error);
        return;
      }

      if (data?.categoryId) {
        const category = categories.find(c => c.id === data.categoryId);
        if (category) {
          console.log('[CategorySelector] AI suggested:', category.name, '-', data.reasoning);
          setAiSuggestionReasoning(data.reasoning || '');
          
          if (category.parent_id) {
            // It's a subcategory
            setSelectedParent(category.parent_id);
            loadSubCategories(category.parent_id);
            setSuggestedCategory(data.categoryId);
            onChange(data.categoryId);
          } else {
            // It's a parent category
            setSuggestedCategory(data.categoryId);
            setSelectedParent(data.categoryId);
            loadSubCategories(data.categoryId);
          }
        }
      }
    } catch (error) {
      console.log('[CategorySelector] AI suggestion error:', error);
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleFeedback = async (feedbackType: 'incorrect' | 'helpful' | 'no_suggestion') => {
    if (!itemName || !onFeedback) return;
    
    setFeedbackGiven(true);
    setShowFeedback(false);
    
    onFeedback({
      itemName,
      suggestedCategoryId: suggestedCategory,
      actualCategoryId: value,
      feedbackType,
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>
          Category
          {aiSuggesting && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              🤖 AI is suggesting...
            </span>
          )}
          {!aiSuggesting && suggestedCategory && selectedParent && (
            <span className="ml-2 text-xs text-primary font-normal">
              ✨ {aiSuggestionReasoning ? 'AI-suggested' : 'Auto-suggested'}
            </span>
          )}
        </Label>
        <Select value={selectedParent || ""} onValueChange={handleParentChange}>
          <SelectTrigger className={suggestedCategory && selectedParent ? "border-primary" : ""}>
            <SelectValue placeholder="Select a category..." />
          </SelectTrigger>
          <SelectContent>
            {parentCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedParent && subCategories.length > 0 && (
        <div>
          <Label>
            Subcategory
            {suggestedCategory && value && (
              <span className="ml-2 text-xs text-primary font-normal">
                ✨ Suggested
              </span>
            )}
          </Label>
          <Select value={value || ""} onValueChange={handleSubCategoryChange}>
            <SelectTrigger className={suggestedCategory && value ? "border-primary" : ""}>
              <SelectValue placeholder="Select subcategory..." />
            </SelectTrigger>
            <SelectContent>
              {subCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {/* Feedback Section */}
      {suggestedCategory && value && showFeedback && (
        <div className="p-3 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">Was this suggestion helpful?</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('helpful')}
              className="flex-1"
            >
              👍 Yes, helpful
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('incorrect')}
              className="flex-1"
            >
              👎 No, incorrect
            </Button>
          </div>
        </div>
      )}
      
      {!suggestedCategory && itemName && itemName.length >= 3 && (
        <div className="p-3 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">No suggestion found for "{itemName}"</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('no_suggestion')}
            className="w-full"
          >
            Report missing suggestion
          </Button>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        {suggestedCategory && aiSuggestionReasoning
          ? `🤖 AI: ${aiSuggestionReasoning}`
          : suggestedCategory 
            ? "Auto-suggested from catalog and common keywords. You can change this if needed."
            : "Categories help organize your items"}
      </p>
    </div>
  );
}
