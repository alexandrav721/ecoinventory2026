import { useState, useRef, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getCommonTags } from "@/lib/duplicateDetection";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = "Add tags..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    const tags = await getCommonTags();
    setSuggestions(tags);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
      setIsOpen(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    tag => 
      !value.includes(tag) && 
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-background">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="flex-1 min-w-[120px]">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6"
              />
            </div>
          </PopoverTrigger>
          {filteredSuggestions.length > 0 && (
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search tags..." value={inputValue} onValueChange={setInputValue} />
                <CommandList>
                  <CommandEmpty>
                    Press Enter to create "{inputValue}"
                  </CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    {filteredSuggestions.slice(0, 10).map((tag) => (
                      <CommandItem
                        key={tag}
                        onSelect={() => addTag(tag)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
      </div>
      <p className="text-xs text-muted-foreground">
        Type and press Enter or comma to add tags. Tags help find similar items.
      </p>
    </div>
  );
}
