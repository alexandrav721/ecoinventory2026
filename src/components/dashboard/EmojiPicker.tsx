import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  "Objects": ["📦", "📁", "🗂️", "🏷️", "⭐", "💼", "🎯", "📌", "🔖", "💎", "🎁", "🎀", "🎊", "🎉"],
  "Home & Living": ["🏠", "🛋️", "🛏️", "🪑", "🚪", "🪟", "🖼️", "🕯️", "💡", "🔦", "🧹", "🧺", "🪣"],
  "Technology": ["💻", "📱", "⌚", "🖥️", "⌨️", "🖱️", "🖨️", "📷", "🎮", "🎧", "📡", "💾", "💿", "📀"],
  "Clothing & Fashion": ["👕", "👔", "👗", "👘", "👠", "👟", "👜", "🎒", "👓", "🕶️", "👑", "🎩", "🧢", "⛑️"],
  "Beauty & Care": ["💄", "💅", "🧴", "🧼", "🧽", "🪥", "🪒", "💆", "💇", "🧖", "🪮"],
  "Kitchen & Dining": ["🍳", "🔪", "🥄", "🍽️", "🥘", "☕", "🍷", "🧊", "🧃", "🥤", "🍴", "🥢"],
  "Tools & Hardware": ["🔧", "🔨", "🪛", "🪚", "⚒️", "🛠️", "⚙️", "🔩", "⛏️", "🪓", "⛓️"],
  "Sports & Fitness": ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🎱", "⛳", "🏸", "🥊", "⛸️", "🛹"],
  "Music & Arts": ["🎵", "🎸", "🎹", "🎨", "🖌️", "✏️", "📐", "📏", "🎭", "🎪", "🎬", "🎤", "🎧"],
  "Toys & Games": ["🧸", "🎲", "🧩", "🎯", "🪀", "🪁", "🎪", "🎠", "🎡", "🎢", "🎰"],
  "Books & Education": ["📚", "📖", "📝", "📓", "📔", "📕", "📗", "📘", "🎓", "🎒", "✏️", "📏"],
  "Garden & Outdoor": ["🌿", "🌱", "🌻", "🌺", "🪴", "🌳", "🌲", "⛺", "🏕️", "🪵", "🌾"],
  "Automotive": ["🚗", "🚙", "🚕", "🚓", "🏎️", "🚜", "🛵", "🚲", "⚙️", "🔧", "🛞"],
  "Bathroom": ["🚿", "🛁", "🚽", "🧻", "🧴", "🧼", "🪥", "🧽", "🪣", "🧹"],
  "Baby & Kids": ["🍼", "👶", "🧷", "🧸", "👣", "🎈", "🎀", "🧦", "👟", "🧸"],
  "Pet Supplies": ["🐕", "🐈", "🐠", "🦜", "🐹", "🦎", "🐢", "🦔", "🦮", "🐾"],
  "Office": ["📎", "✂️", "📌", "📍", "🖊️", "✒️", "📏", "📐", "🗄️", "📋", "📑"],
  "Medical": ["💊", "🩹", "🩺", "💉", "🌡️", "🧬", "🔬", "🧪", "⚕️", "🏥"],
  "Food & Drinks": ["🍕", "🍔", "🌮", "🍜", "🍱", "🍙", "🍣", "🥗", "🥙", "🧆", "🍦", "🍰"],
  "Nature": ["🌸", "🌼", "🌷", "🌹", "🌴", "🌵", "🍃", "🍂", "🍁", "🍀", "🌾"],
};

export const EmojiPicker = ({ value, onChange }: EmojiPickerProps) => {
  const [search, setSearch] = useState("");

  // Get the emoji without the prefix
  const currentEmoji = value?.startsWith("emoji:") ? value.slice(6) : value;

  // Filter emojis based on search
  const filteredCategories = Object.entries(EMOJI_CATEGORIES).reduce((acc, [category, emojis]) => {
    if (search) {
      const filtered = emojis.filter(emoji => emoji.includes(search) || category.toLowerCase().includes(search.toLowerCase()));
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
    } else {
      acc[category] = emojis;
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Select Emoji</Label>
        <Input
          placeholder="Search emojis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {currentEmoji && (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
          <span className="text-6xl">{currentEmoji}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">Selected Emoji</p>
            <p className="text-xs text-muted-foreground">This will represent your item</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
          >
            Clear
          </Button>
        </div>
      )}

      <ScrollArea className="h-[300px] border rounded-lg p-4">
        <div className="space-y-4">
          {Object.entries(filteredCategories).map(([category, emojis]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground sticky top-0 bg-background py-1">
                {category}
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {emojis.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={currentEmoji === emoji ? "default" : "ghost"}
                    size="sm"
                    className="h-10 w-10 p-0 text-2xl hover:scale-110 transition-transform"
                    onClick={() => onChange(`emoji:${emoji}`)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Select an emoji to visually represent this item in your inventory
      </p>
    </div>
  );
};
