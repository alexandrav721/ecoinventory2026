import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Plus, GripVertical, Check, MoveRight, X } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

interface InventoryItem {
  id: string;
  name: string;
  location: string | null;
  image_urls: string[] | null;
  categories?: { name: string };
}

interface LocationGroup {
  location: string;
  items: InventoryItem[];
}

export const LocationOrganizer = () => {
  const [locationGroups, setLocationGroups] = useState<LocationGroup[]>([]);
  const [unassignedItems, setUnassignedItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMoveLocation, setBulkMoveLocation] = useState<string>("");
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchItemsByLocation();
  }, []);

  const fetchItemsByLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: items, error } = await supabase
        .from("inventory_items")
        .select(`
          id,
          name,
          location,
          image_urls,
          categories (name)
        `)
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      const unassigned: InventoryItem[] = [];
      const groupMap = new Map<string, InventoryItem[]>();

      items?.forEach((item) => {
        if (!item.location) {
          unassigned.push(item as InventoryItem);
        } else {
          if (!groupMap.has(item.location)) {
            groupMap.set(item.location, []);
          }
          groupMap.get(item.location)?.push(item as InventoryItem);
        }
      });

      const groups: LocationGroup[] = Array.from(groupMap.entries())
        .map(([location, items]) => ({ location, items }))
        .sort((a, b) => a.location.localeCompare(b.location));

      setUnassignedItems(unassigned);
      setLocationGroups(groups);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const newLocation = over.id === "unassigned" ? null : (over.id as string);

    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ location: newLocation })
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item location updated");
      fetchItemsByLocation();
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    }
  };

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    
    const exists = locationGroups.some(g => g.location.toLowerCase() === newLocation.toLowerCase());
    if (exists) {
      toast.error("Location already exists");
      return;
    }

    setLocationGroups([...locationGroups, { location: newLocation, items: [] }]);
    setNewLocation("");
    toast.success("Location added");
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = (items: InventoryItem[]) => {
    const newSelection = new Set(selectedItems);
    items.forEach(item => newSelection.add(item.id));
    setSelectedItems(newSelection);
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkMove = async () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected");
      return;
    }

    if (!bulkMoveLocation) {
      toast.error("Please select a destination location");
      return;
    }

    const newLocationValue = bulkMoveLocation === "unassigned" ? null : bulkMoveLocation;

    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ location: newLocationValue })
        .in("id", Array.from(selectedItems));

      if (error) throw error;

      toast.success(`Moved ${selectedItems.size} item(s) successfully`);
      setSelectedItems(new Set());
      setBulkMoveLocation("");
      fetchItemsByLocation();
    } catch (error) {
      console.error("Error moving items:", error);
      toast.error("Failed to move items");
    }
  };

  const getDraggedItem = () => {
    if (!activeId) return null;
    return [...unassignedItems, ...locationGroups.flatMap(g => g.items)].find(
      item => item.id === activeId
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Bulk Actions Bar */}
        {selectedItems.size > 0 && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="secondary" className="text-base px-4 py-2">
                  <Check className="w-4 h-4 mr-2" />
                  {selectedItems.size} selected
                </Badge>
                
                <div className="flex items-center gap-2 flex-1">
                  <Select value={bulkMoveLocation} onValueChange={setBulkMoveLocation}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Move to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {locationGroups.map((group) => (
                        <SelectItem key={group.location} value={group.location}>
                          {group.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={handleBulkMove} className="gap-2">
                    <MoveRight className="w-4 h-4" />
                    Move
                  </Button>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={deselectAll}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Living Room, Kitchen, Garage"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
              />
              <Button onClick={handleAddLocation} className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Items */}
        <LocationDropZone
          id="unassigned"
          title="Unassigned Items"
          items={unassignedItems}
          highlight
          selectedItems={selectedItems}
          onToggleSelection={toggleItemSelection}
          onSelectAll={() => selectAll(unassignedItems)}
        />

        {/* Location Groups */}
        {locationGroups.map((group) => (
          <LocationDropZone
            key={group.location}
            id={group.location}
            title={group.location}
            items={group.items}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            onSelectAll={() => selectAll(group.items)}
          />
        ))}

        {locationGroups.length === 0 && unassignedItems.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Package className="w-12 h-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No items yet</h3>
                <p className="text-muted-foreground">
                  Add items to your inventory to organize them by location
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <DragOverlay>
        {activeId ? <DraggableItemPreview item={getDraggedItem()} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

interface LocationDropZoneProps {
  id: string;
  title: string;
  items: InventoryItem[];
  highlight?: boolean;
  selectedItems: Set<string>;
  onToggleSelection: (itemId: string) => void;
  onSelectAll: () => void;
}

const LocationDropZone = ({ 
  id, 
  title, 
  items, 
  highlight, 
  selectedItems, 
  onToggleSelection,
  onSelectAll 
}: LocationDropZoneProps) => {
  const allSelected = items.length > 0 && items.every(item => selectedItems.has(item.id));

  return (
    <Card className={highlight ? "border-primary border-2" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectAll();
                  } else {
                    items.forEach(item => {
                      if (selectedItems.has(item.id)) {
                        onToggleSelection(item.id);
                      }
                    });
                  }
                }}
              />
            )}
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Package className="w-3 h-3" />
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div
          data-droppable-id={id}
          className="min-h-[100px] rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 transition-colors hover:border-primary/50"
        >
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Drag items here
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((item) => (
                <DraggableItem 
                  key={item.id} 
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onToggleSelection={onToggleSelection}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface DraggableItemProps {
  item: InventoryItem;
  isSelected: boolean;
  onToggleSelection: (itemId: string) => void;
}

const DraggableItem = ({ item, isSelected, onToggleSelection }: DraggableItemProps) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        const dropZone = (e.target as HTMLElement).closest('[data-droppable-id]');
        if (dropZone) {
          e.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={async (e) => {
        e.preventDefault();
        const dropZone = (e.target as HTMLElement).closest('[data-droppable-id]');
        if (!dropZone) return;

        const locationId = dropZone.getAttribute('data-droppable-id');
        const newLocation = locationId === "unassigned" ? null : locationId;

        try {
          const { error } = await supabase
            .from("inventory_items")
            .update({ location: newLocation })
            .eq("id", item.id);

          if (error) throw error;
          toast.success("Item location updated");
          window.location.reload();
        } catch (error) {
          console.error("Error updating location:", error);
          toast.error("Failed to update location");
        }
      }}
      className={`group relative aspect-square rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-all cursor-move ${
        isSelected ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
    >
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(item.id);
          }}
          className="cursor-pointer"
        >
          <Checkbox
            checked={isSelected}
            className="bg-white border-2"
          />
        </div>
        <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
      </div>
      {item.image_urls && item.image_urls.length > 0 ? (
        <img
          src={item.image_urls[0]}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white font-medium text-xs truncate drop-shadow-md">
          {item.name}
        </p>
        {item.categories && (
          <p className="text-white/80 text-xs truncate drop-shadow-md">
            {item.categories.name}
          </p>
        )}
      </div>
    </div>
  );
};

const DraggableItemPreview = ({ item }: { item: InventoryItem | null | undefined }) => {
  if (!item) return null;

  return (
    <div className="aspect-square w-24 rounded-lg overflow-hidden border-2 border-primary bg-card shadow-xl opacity-80">
      {item.image_urls && item.image_urls.length > 0 ? (
        <img
          src={item.image_urls[0]}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
