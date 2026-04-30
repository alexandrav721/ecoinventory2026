import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Rect, Text, Circle, Line } from "fabric";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Home, Trash2, Plus, ChevronDown, Archive, Edit2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface InventoryItem {
  id: string;
  name: string;
  location: string | null;
  image_urls: string[] | null;
  categories?: { name: string };
  original_price?: number | null;
}

interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  order?: number;
}

const ROOM_COLORS = [
  "#e3f2fd", "#f3e5f5", "#e8f5e9", "#fff3e0", 
  "#fce4ec", "#e0f2f1", "#f9fbe7", "#ede7f6"
];

const DEFAULT_ROOMS = [
  { name: "Living Room", col: 0, row: 0 },
  { name: "Kitchen", col: 1, row: 0 },
  { name: "Bedroom", col: 2, row: 0 },
  { name: "Bathroom", col: 0, row: 1 },
  { name: "Dining Room", col: 1, row: 1 },
  { name: "Garage", col: 2, row: 1 },
];

export const FloorPlanView = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomOrder, setRoomOrder] = useState<string[]>([]);
  const [subSpaceOrder, setSubSpaceOrder] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedLocation, setHighlightedLocation] = useState<string | null>(null);
  const [unassignedItems, setUnassignedItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'floor-plan' | 'room-interior'>('floor-plan');
  const [newSubSpace, setNewSubSpace] = useState("");
  const [roomSubSpaces, setRoomSubSpaces] = useState<Record<string, string[]>>({});
  const [selectedSubSpace, setSelectedSubSpace] = useState<string | null>(null);
  const [subSpaceDialogOpen, setSubSpaceDialogOpen] = useState(false);
  const [editingSubSpace, setEditingSubSpace] = useState<string | null>(null);
  const [editSubSpaceName, setEditSubSpaceName] = useState("");
  const [storageSpacesOpen, setStorageSpacesOpen] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || fabricCanvas) return;

    try {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: "#f8f9fa",
      });

      // Draw house outline
      const houseOutline = new Rect({
        left: 50,
        top: 50,
        width: 700,
        height: 500,
        fill: "transparent",
        stroke: "#333",
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });

      canvas.add(houseOutline);

      canvas.renderAll();

      setFabricCanvas(canvas);

      return () => {
        canvas.dispose();
      };
    } catch (error) {
      console.error("Error initializing canvas:", error);
      toast.error("Failed to initialize floor plan");
    }
  }, []);

  useEffect(() => {
      // Load saved orders from localStorage
      const savedRoomOrder = localStorage.getItem('floorplan-room-order');
      const savedSubSpaceOrder = localStorage.getItem('floorplan-subspace-order');
      
      if (savedRoomOrder) {
        setRoomOrder(JSON.parse(savedRoomOrder));
      }
      if (savedSubSpaceOrder) {
        setSubSpaceOrder(JSON.parse(savedSubSpaceOrder));
      }

      fetchItems();
  }, []);

  useEffect(() => {
    // Initialize default rooms when canvas is ready
    if (fabricCanvas && rooms.length === 0 && viewMode === 'floor-plan') {
      initializeDefaultRooms();
    }
  }, [fabricCanvas, viewMode]);

  useEffect(() => {
    // Update room labels and stats when items change
    if (fabricCanvas && rooms.length > 0 && viewMode === 'floor-plan') {
      // Update overall stats
      const objects = fabricCanvas.getObjects();
      const oldStatsText = objects.find((obj: any) => 
        obj.type === 'text' && obj.top === 50 && obj.left === 380
      );
      if (oldStatsText) {
        fabricCanvas.remove(oldStatsText);
      }

      const overallStats = getOverallStatistics();
      const statsText = new Text(`${overallStats.totalItems} items • $${overallStats.totalValue.toFixed(0)} value • ${overallStats.totalRooms} rooms • ${overallStats.assignedItems} assigned`, {
        left: 380,
        top: 50,
        fontSize: 12,
        fill: "#666",
        originX: "center",
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(statsText);

      // Update room labels
      rooms.forEach(room => {
        updateRoomLabel(room.name, room.id, room.x, room.y);
      });
      
      fabricCanvas.renderAll();
    }
  }, [allItems, rooms.length, viewMode]);

  useEffect(() => {
    // Render interior view when in that mode
    if (fabricCanvas && viewMode === 'room-interior' && selectedRoom) {
      renderRoomInterior();
    }
  }, [fabricCanvas, viewMode, selectedRoom, allItems, roomSubSpaces]);

  const initializeDefaultRooms = () => {
    if (!fabricCanvas) return;

    const newRooms: Room[] = [];

    DEFAULT_ROOMS.forEach((defaultRoom, index) => {
      const roomId = `room-${Date.now()}-${index}`;
      const colorIndex = index % ROOM_COLORS.length;
      
      const x = 80 + (defaultRoom.col * 220);
      const y = 100 + (defaultRoom.row * 150);

      const room: Room = {
        id: roomId,
        name: defaultRoom.name,
        x,
        y,
        width: 200,
        height: 130,
        color: ROOM_COLORS[colorIndex],
      };

      // Draw room rectangle
      const roomRect = new Rect({
        left: x,
        top: y,
        width: room.width,
        height: room.height,
        fill: room.color,
        stroke: "#666",
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        selectable: false,
        hoverCursor: "pointer",
      });

      roomRect.set({ data: { roomId, roomName: room.name } });

      // Add click handler to room
      roomRect.on('mousedown', () => {
        const clickedRoom = newRooms.find(r => r.id === roomId);
        if (clickedRoom) {
          setSelectedRoom(clickedRoom);
          setViewMode('room-interior');
        }
      });

      fabricCanvas.add(roomRect);
      newRooms.push(room);
    });

    fabricCanvas.renderAll();
    setRooms(newRooms);
    // Add labels after all rooms are created
    newRooms.forEach(room => {
      updateRoomLabel(room.name, room.id, room.x, room.y);
    });
  };

  const fetchItems = async () => {
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
          original_price,
          categories (name)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const unassigned = items?.filter(item => !item.location) || [];
      setUnassignedItems(unassigned as InventoryItem[]);
      setAllItems(items as InventoryItem[] || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const getItemCountForRoom = (roomName: string): number => {
    return allItems.filter(item => item.location?.startsWith(roomName)).length;
  };

  const getRoomStatistics = (roomName: string) => {
    const roomItems = allItems.filter(item => item.location?.startsWith(roomName));
    const totalValue = roomItems.reduce((sum, item) => sum + (item.original_price || 0), 0);
    const categories = roomItems.map(item => item.categories?.name).filter(Boolean);
    const uniqueCategories = new Set(categories);
    
    return {
      itemCount: roomItems.length,
      totalValue,
      categoryCount: uniqueCategories.size
    };
  };

  const getOverallStatistics = () => {
    const totalValue = allItems.reduce((sum, item) => sum + (item.original_price || 0), 0);
    const categories = allItems.map(item => item.categories?.name).filter(Boolean);
    const uniqueCategories = new Set(categories);
    const assignedItems = allItems.filter(item => item.location).length;
    
    return {
      totalItems: allItems.length,
      totalValue,
      totalRooms: rooms.length,
      totalCategories: uniqueCategories.size,
      assignedItems,
      unassignedItems: unassignedItems.length
    };
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setHighlightedLocation(null);
      toast.info("Enter an item name to search");
      return;
    }

    const foundItem = allItems.find(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundItem) {
      setHighlightedLocation(foundItem.location || "unassigned");
      
      // Navigate to the appropriate view
      if (foundItem.location) {
        const roomName = foundItem.location.split(" > ")[0];
        const room = rooms.find(r => r.name === roomName);
        
        if (room) {
          setSelectedRoom(room);
          if (foundItem.location.includes(" > ")) {
            // Item is in a sub-space
            setViewMode('room-interior');
            toast.success(`Found "${foundItem.name}" in ${foundItem.location}`);
          } else {
            // Item is in a room but no sub-space
            setViewMode('room-interior');
            toast.success(`Found "${foundItem.name}" in ${roomName}`);
          }
        }
      } else {
        // Unassigned item
        setViewMode('floor-plan');
        toast.success(`Found "${foundItem.name}" in unassigned items`);
      }
    } else {
      toast.error(`No item found matching "${searchQuery}"`);
      setHighlightedLocation(null);
    }
  };

  const getSubSpaces = (roomName: string): string[] => {
    // Get sub-spaces from items
    const itemSubSpaces = new Set<string>();
    allItems.forEach(item => {
      if (item.location?.startsWith(roomName + " > ")) {
        const parts = item.location.split(" > ");
        if (parts.length > 1) {
          itemSubSpaces.add(parts[1]);
        }
      }
    });
    
    // Get created sub-spaces from state
    const createdSubSpaces = roomSubSpaces[roomName] || [];
    
    // Combine both and return unique sorted list
    return Array.from(new Set([...itemSubSpaces, ...createdSubSpaces])).sort();
  };

  const addSubSpace = async () => {
    if (!newSubSpace.trim() || !selectedRoom) {
      toast.error("Please enter a sub-space name");
      return;
    }

    const existingSubSpaces = getSubSpaces(selectedRoom.name);
    if (existingSubSpaces.includes(newSubSpace.trim())) {
      toast.error("Sub-space already exists");
      return;
    }

    // Add to state
    setRoomSubSpaces(prev => ({
      ...prev,
      [selectedRoom.name]: [...(prev[selectedRoom.name] || []), newSubSpace.trim()]
    }));

    setNewSubSpace("");
    toast.success(`Added ${newSubSpace} to ${selectedRoom.name}`);
  };

  const updateSubSpace = (oldName: string, newName: string) => {
    if (!selectedRoom || !newName.trim()) {
      toast.error("Please enter a sub-space name");
      return;
    }

    const existingSubSpaces = getSubSpaces(selectedRoom.name);
    if (existingSubSpaces.includes(newName.trim()) && oldName !== newName.trim()) {
      toast.error("Sub-space already exists");
      return;
    }

    // Update sub-space name in state
    setRoomSubSpaces(prev => {
      const roomSpaces = prev[selectedRoom.name] || [];
      return {
        ...prev,
        [selectedRoom.name]: roomSpaces.map(space => space === oldName ? newName.trim() : space)
      };
    });

    // Update items that are in this sub-space
    const itemsToUpdate = allItems.filter(
      item => item.location === `${selectedRoom.name} > ${oldName}`
    );

    itemsToUpdate.forEach(async (item) => {
      await supabase
        .from("inventory_items")
        .update({ location: `${selectedRoom.name} > ${newName.trim()}` })
        .eq("id", item.id);
    });

    setEditingSubSpace(null);
    setEditSubSpaceName("");
    toast.success(`Updated ${oldName} to ${newName}`);
    fetchItems(); // Refresh items
  };

  const deleteSubSpace = (subSpaceName: string) => {
    if (!selectedRoom) return;

    // Remove from state
    setRoomSubSpaces(prev => {
      const roomSpaces = prev[selectedRoom.name] || [];
      return {
        ...prev,
        [selectedRoom.name]: roomSpaces.filter(space => space !== subSpaceName)
      };
    });

    // Move items from this sub-space back to just the room
    const itemsToUpdate = allItems.filter(
      item => item.location === `${selectedRoom.name} > ${subSpaceName}`
    );

    itemsToUpdate.forEach(async (item) => {
      await supabase
        .from("inventory_items")
        .update({ location: selectedRoom.name })
        .eq("id", item.id);
    });

    toast.success(`Deleted ${subSpaceName}`);
    fetchItems(); // Refresh items
  };

  const renderRoomInterior = () => {
    if (!fabricCanvas || !selectedRoom) return;

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#fafafa";

    // Draw room outline
    const roomOutline = new Rect({
      left: 50,
      top: 60,
      width: 700,
      height: 450,
      fill: "transparent",
      stroke: "#666",
      strokeWidth: 3,
      rx: 8,
      ry: 8,
      selectable: false,
      evented: false,
    });
    fabricCanvas.add(roomOutline);

    // Draw sub-spaces
    const subSpaces = getSubSpaces(selectedRoom.name);
    console.log("Drawing interior for", selectedRoom.name, "with subspaces:", subSpaces);
    
    // Show items that are in the room but not in any sub-space as an "Unassigned" box
    const roomOnlyItems = allItems.filter(item => item.location === selectedRoom.name);
    
    // Convert subspaces to objects for consistent handling
    const subSpaceObjects = subSpaces.map(name => ({ name, isUnassigned: false }));
    
    // Add unassigned items box if there are any
    const spacesToRender = subSpaces.length === 0 && roomOnlyItems.length === 0 
      ? [] 
      : roomOnlyItems.length > 0 
        ? [{ name: "Unassigned", isUnassigned: true }, ...subSpaceObjects]
        : subSpaceObjects;
    
      // Sort spaces by custom order first, then by item count
      let finalSpaces = [...spacesToRender];
      const roomSubSpaceOrder = subSpaceOrder[selectedRoom.name];
      
      if (roomSubSpaceOrder && roomSubSpaceOrder.length > 0) {
        finalSpaces.sort((a, b) => {
          const indexA = roomSubSpaceOrder.indexOf(a.name);
          const indexB = roomSubSpaceOrder.indexOf(b.name);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      } else {
        finalSpaces = [...spacesToRender].sort((a, b) => {
          const countA = a.isUnassigned 
            ? roomOnlyItems.length
            : allItems.filter(i => i.location === `${selectedRoom.name} > ${a.name}`).length;
          const countB = b.isUnassigned 
            ? roomOnlyItems.length
            : allItems.filter(i => i.location === `${selectedRoom.name} > ${b.name}`).length;
          return countB - countA;
        });
      }
    
    if (finalSpaces.length === 0) {
      const emptyText = new Text("No items in this room", {
        left: 400,
        top: 325,
        fontSize: 16,
        fill: "#999",
        originX: "center",
        originY: "center",
        textAlign: "center",
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(emptyText);
    } else {
      const cols = Math.min(Math.ceil(Math.sqrt(finalSpaces.length)), 3);
      const spacing = 20;
      const containerWidth = 700 - (2 * spacing);
      const containerHeight = 490 - (2 * spacing);
      const subSpaceWidth = (containerWidth - (cols - 1) * spacing) / cols;
      const rows = Math.ceil(finalSpaces.length / cols);
      const subSpaceHeight = Math.min((containerHeight - (rows - 1) * spacing) / rows, 150);

      finalSpaces.forEach((space: any, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = 50 + spacing + (col * (subSpaceWidth + spacing));
        const y = 60 + spacing + (row * (subSpaceHeight + spacing));
        
        const itemCount = space.isUnassigned 
          ? roomOnlyItems.length
          : allItems.filter(i => i.location === `${selectedRoom.name} > ${space.name}`).length;
        
        // Get unique categories in this space
        const spaceItems = space.isUnassigned
          ? roomOnlyItems
          : allItems.filter(i => i.location === `${selectedRoom.name} > ${space.name}`);
        const categories = [...new Set(spaceItems.map(i => i.categories?.name).filter(Boolean))];
        
        const isHighlighted = highlightedLocation === (space.isUnassigned 
          ? selectedRoom.name 
          : `${selectedRoom.name} > ${space.name}`);
        
        const subSpaceRect = new Rect({
          left: x,
          top: y,
          width: subSpaceWidth,
          height: subSpaceHeight,
          fill: isHighlighted 
            ? "#fbbf24" 
            : space.isUnassigned ? "#fef3c7" : "#e3f2fd",
          stroke: isHighlighted 
            ? "#f59e0b"
            : space.isUnassigned ? "#f59e0b" : "#1976d2",
          strokeWidth: isHighlighted ? 4 : 2,
          rx: 8,
          ry: 8,
          selectable: !space.isUnassigned,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hasControls: false,
          hoverCursor: space.isUnassigned ? "default" : "move",
        });

        subSpaceRect.set({ data: { subSpaceName: space.name, isUnassigned: space.isUnassigned, originalIndex: index } });

        if (!space.isUnassigned) {
          // Handle dragging
          subSpaceRect.on('moving', () => {
            // Keep within bounds
            const containerLeft = 50 + spacing;
            const containerTop = 60 + spacing;
            if (subSpaceRect.left! < containerLeft) subSpaceRect.left = containerLeft;
            if (subSpaceRect.top! < containerTop) subSpaceRect.top = containerTop;
            if (subSpaceRect.left! + subSpaceWidth > 750 - spacing) subSpaceRect.left = 750 - spacing - subSpaceWidth;
            if (subSpaceRect.top! + subSpaceHeight > 550 - spacing) subSpaceRect.top = 550 - spacing - subSpaceHeight;
          });

          subSpaceRect.on('modified', () => {
            // Recalculate order based on position
            const allSubSpaceObjects = fabricCanvas.getObjects().filter((obj: any) => obj.data?.subSpaceName && !obj.data?.isUnassigned);
            const containerLeft = 50 + spacing;
            const containerTop = 60 + spacing;
            const newOrder = allSubSpaceObjects
              .sort((a: any, b: any) => {
                const aRow = Math.floor((a.top! - containerTop) / (subSpaceHeight + spacing));
                const bRow = Math.floor((b.top! - containerTop) / (subSpaceHeight + spacing));
                if (aRow !== bRow) return aRow - bRow;
                return a.left! - b.left!;
              })
              .map((obj: any) => obj.data.subSpaceName);
            
            const updatedOrder = { ...subSpaceOrder, [selectedRoom.name]: newOrder };
            setSubSpaceOrder(updatedOrder);
            localStorage.setItem('floorplan-subspace-order', JSON.stringify(updatedOrder));
            toast.success("Storage space order updated");
          });

          // Click to view details (only on single click, not drag)
          let isDragging = false;
          subSpaceRect.on('mousedown', () => { isDragging = false; });
          subSpaceRect.on('moving', () => { isDragging = true; });
          subSpaceRect.on('mouseup', () => {
            if (!isDragging) {
              setSelectedSubSpace(space.name);
              setSubSpaceDialogOpen(true);
            }
          });
        }

        const subSpaceLabel = new Text(`${space.name}\n${itemCount} item${itemCount !== 1 ? 's' : ''}${categories.length > 0 ? '\n' + categories.slice(0, 2).join(', ') : ''}`, {
          left: x + subSpaceWidth / 2,
          top: y + subSpaceHeight / 2,
          fontSize: 14,
          fontWeight: "bold",
          fill: "#333",
          originX: "center",
          originY: "center",
          textAlign: "center",
          selectable: false,
          evented: false,
        });

        fabricCanvas.add(subSpaceRect, subSpaceLabel);
      });
    }

    fabricCanvas.renderAll();
  };

  const goBackToFloorPlan = () => {
    setViewMode('floor-plan');
    setNewSubSpace(""); // Clear sub-space input when going back
    if (fabricCanvas && rooms.length > 0) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#f8f9fa";

      // Redraw house outline
      const houseOutline = new Rect({
        left: 50,
        top: 50,
        width: 700,
        height: 500,
        fill: "transparent",
        stroke: "#333",
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(houseOutline);

      // Sort rooms by custom order first, then by item count
      let sortedRooms = [...rooms];
      if (roomOrder.length > 0) {
        sortedRooms.sort((a, b) => {
          const indexA = roomOrder.indexOf(a.name);
          const indexB = roomOrder.indexOf(b.name);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      } else {
        sortedRooms = [...rooms].sort((a, b) => {
          const countA = getItemCountForRoom(a.name);
          const countB = getItemCountForRoom(b.name);
          console.log(`Sorting: ${a.name} (${countA} items) vs ${b.name} (${countB} items)`);
          return countB - countA;
        });
      }
      
      console.log("Final room order:", sortedRooms.map(r => `${r.name} (${getItemCountForRoom(r.name)} items)`));

      // Calculate grid positions for sorted rooms
      const cols = 2;
      const spacing = 20;
      const startX = 50 + spacing;
      const startY = 50 + spacing;
      const roomWidth = (700 - (cols + 1) * spacing) / cols;
      const roomHeight = 120;

      // Redraw all rooms
      sortedRooms.forEach((room, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = startX + (col * (roomWidth + spacing));
        const y = startY + (row * (roomHeight + spacing));

        const isHighlighted = highlightedLocation === room.name || 
                             highlightedLocation?.startsWith(room.name + " > ");

        const roomRect = new Rect({
          left: x,
          top: y,
          width: roomWidth,
          height: roomHeight,
          fill: isHighlighted ? "#fbbf24" : room.color,
          stroke: isHighlighted ? "#f59e0b" : "#666",
          strokeWidth: isHighlighted ? 4 : 2,
          rx: 8,
          ry: 8,
          selectable: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hasControls: false,
          hoverCursor: "move",
        });

        roomRect.set({ data: { roomId: room.id, roomName: room.name, originalIndex: index } });

        // Handle dragging
        roomRect.on('moving', () => {
          // Keep within bounds
          if (roomRect.left! < startX) roomRect.left = startX;
          if (roomRect.top! < startY) roomRect.top = startY;
          if (roomRect.left! + roomWidth > 750 - spacing) roomRect.left = 750 - spacing - roomWidth;
          if (roomRect.top! + roomHeight > 550 - spacing) roomRect.top = 550 - spacing - roomHeight;
        });

        roomRect.on('modified', () => {
          // Recalculate order based on position (left-to-right, top-to-bottom)
          const allRoomObjects = fabricCanvas.getObjects().filter((obj: any) => obj.data?.roomName);
          const newOrder = allRoomObjects
            .sort((a: any, b: any) => {
              const aRow = Math.floor((a.top! - startY) / (roomHeight + spacing));
              const bRow = Math.floor((b.top! - startY) / (roomHeight + spacing));
              if (aRow !== bRow) return aRow - bRow;
              return a.left! - b.left!;
            })
            .map((obj: any) => obj.data.roomName);
          
          setRoomOrder(newOrder);
          localStorage.setItem('floorplan-room-order', JSON.stringify(newOrder));
          toast.success("Room order updated");
        });

        // Click to view interior (only on single click, not drag)
        let isDragging = false;
        roomRect.on('mousedown', () => { isDragging = false; });
        roomRect.on('moving', () => { isDragging = true; });
        roomRect.on('mouseup', () => {
          if (!isDragging) {
            setSelectedRoom(room);
            setViewMode('room-interior');
          }
        });

        fabricCanvas.add(roomRect);
        updateRoomLabel(room.name, room.id, x, y);
      });

      fabricCanvas.renderAll();
    }
  };

  const updateRoomLabel = (roomName: string, roomId: string, x: number, y: number) => {
    if (!fabricCanvas) return;

    // Remove old label
    const objects = fabricCanvas.getObjects();
    const oldLabel = objects.find((obj: any) => 
      obj.data?.roomId === roomId && obj.type === 'text'
    );
    if (oldLabel) {
      fabricCanvas.remove(oldLabel);
    }

    // Add new label with count
    const itemCount = getItemCountForRoom(roomName);
    const labelText = itemCount > 0 ? `${roomName}\n${itemCount} item${itemCount !== 1 ? 's' : ''}` : roomName;
    
    const roomLabel = new Text(labelText, {
      left: x + 100,
      top: y + 55,
      fontSize: 16,
      fontWeight: "bold",
      fill: "#333",
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      textAlign: "center",
    });

    roomLabel.set({ data: { roomId } });
    fabricCanvas.add(roomLabel);
    fabricCanvas.renderAll();
  };

  const addRoom = () => {
    console.log("Add room clicked", { newRoomName, fabricCanvas: !!fabricCanvas });
    
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    if (!fabricCanvas) {
      console.error("Canvas not initialized");
      toast.error("Canvas not ready, please try again");
      return;
    }

    const roomExists = rooms.some(r => r.name.toLowerCase() === newRoomName.toLowerCase());
    if (roomExists) {
      toast.error("Room already exists");
      return;
    }

    try {
      const roomId = `room-${Date.now()}`;
      const colorIndex = rooms.length % ROOM_COLORS.length;
      
      // Position rooms in a grid within the house outline
      const cols = 3;
      const roomIndex = rooms.length;
      const col = roomIndex % cols;
      const row = Math.floor(roomIndex / cols);
      
      const x = 80 + (col * 220);
      const y = 100 + (row * 150);

      const newRoom: Room = {
        id: roomId,
        name: newRoomName,
        x,
        y,
        width: 200,
        height: 130,
        color: ROOM_COLORS[colorIndex],
      };

      console.log("Creating room:", newRoom);

      // Draw room rectangle
      const roomRect = new Rect({
        left: x,
        top: y,
        width: newRoom.width,
        height: newRoom.height,
        fill: newRoom.color,
        stroke: "#666",
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        selectable: false,
        hoverCursor: "pointer",
      });

      roomRect.set({ data: { roomId, roomName: newRoomName } });

      // Add click handler to room
      roomRect.on('mousedown', () => {
        setSelectedRoom(newRoom);
        setViewMode('room-interior');
      });

      fabricCanvas.add(roomRect);
      fabricCanvas.renderAll();

      const updatedRooms = [...rooms, newRoom];
      setRooms(updatedRooms);
      
      // Add label with count
      updateRoomLabel(newRoomName, roomId, x, y);
      
      setNewRoomName("");
      toast.success(`Added ${newRoomName}`);
      console.log("Room added successfully");
    } catch (error) {
      console.error("Error adding room:", error);
      toast.error("Failed to add room");
    }
  };

  const handleItemDrop = async (itemId: string, roomName: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ location: roomName })
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item added to room");
      
      // Refetch items to update counts
      await fetchItems();
      
      // Update the room label with new count
      const room = rooms.find(r => r.name === roomName);
      if (room) {
        // Wait a bit for state to update
        setTimeout(() => {
          updateRoomLabel(room.name, room.id, room.x, room.y);
        }, 100);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to add item to room");
    }
  };

  const moveItemToRoom = async (itemId: string, newRoomName: string, currentLocation: string, subSpace?: string) => {
    try {
      const newLocation = subSpace ? `${newRoomName} > ${subSpace}` : newRoomName;
      
      const { error } = await supabase
        .from("inventory_items")
        .update({ location: newLocation })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(`Item moved to ${newLocation}`);
      
      // Refetch items to update counts
      await fetchItems();
      
      // Update both room labels
      const oldRoomName = currentLocation.split(" > ")[0];
      const oldRoom = rooms.find(r => r.name === oldRoomName);
      const newRoom = rooms.find(r => r.name === newRoomName);
      
      setTimeout(() => {
        if (oldRoom) updateRoomLabel(oldRoom.name, oldRoom.id, oldRoom.x, oldRoom.y);
        if (newRoom) updateRoomLabel(newRoom.name, newRoom.id, newRoom.x, newRoom.y);
      }, 100);
    } catch (error) {
      console.error("Error moving item:", error);
      toast.error("Failed to move item");
    }
  };

  const deleteRoom = (roomId: string) => {
    if (!fabricCanvas) return;

    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Remove all objects associated with this room from canvas
    const objectsToRemove = fabricCanvas.getObjects().filter((obj: any) => {
      return obj.data?.roomId === roomId;
    });

    objectsToRemove.forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();

    setRooms(rooms.filter(r => r.id !== roomId));
    toast.success(`Deleted ${room.name}`);
  };

  const clearFloorPlan = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#f8f9fa";

    // Redraw house outline
    const houseOutline = new Rect({
      left: 50,
      top: 50,
      width: 700,
      height: 500,
      fill: "transparent",
      stroke: "#333",
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });

    const houseLabel = new Text("My Home", {
      left: 380,
      top: 20,
      fontSize: 24,
      fontWeight: "bold",
      fill: "#333",
      selectable: false,
      evented: false,
    });

    fabricCanvas.add(houseOutline, houseLabel);
    fabricCanvas.renderAll();
    
    setRooms([]);
    
    // Auto-reload default rooms after clearing
    setTimeout(() => {
      initializeDefaultRooms();
    }, 100);
    
    toast.success("Floor plan reset to defaults");
  };

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6">
      {/* Left Side - Floor Plan Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            {viewMode === 'floor-plan' ? 'Floor Plan' : `${selectedRoom?.name} - Interior View`}
            {!fabricCanvas && (
              <Badge variant="secondary" className="ml-2">
                Loading...
              </Badge>
            )}
          </CardTitle>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search for an item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pr-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => {
                    setSearchQuery("");
                    setHighlightedLocation(null);
                  }}
                >
                  ×
                </Button>
              )}
            </div>
            <Button onClick={handleSearch} size="sm">
              Search
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-muted-foreground">
              {viewMode === 'floor-plan' 
                ? 'Click a room to view its interior'
                : 'Click storage spaces to view items'}
            </p>
            {viewMode === 'room-interior' && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (selectedRoom) {
                      setRoomDialogOpen(true);
                    }
                  }}
                >
                  View Items List
                </Button>
                <Button variant="outline" size="sm" onClick={goBackToFloorPlan}>
                  Back to Floor Plan
                </Button>
              </div>
            )}
            {viewMode === 'floor-plan' && rooms.length > 0 && (
              <div className="flex gap-2">
                <Select
                  onValueChange={(roomId) => {
                    const room = rooms.find(r => r.id === roomId);
                    if (room) {
                      setSelectedRoom(room);
                      setRoomDialogOpen(true);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="View Items List" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(roomOrder.length > 0 || Object.keys(subSpaceOrder).length > 0) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setRoomOrder([]);
                      setSubSpaceOrder({});
                      localStorage.removeItem('floorplan-room-order');
                      localStorage.removeItem('floorplan-subspace-order');
                      toast.success("Reset to automatic sorting");
                      goBackToFloorPlan();
                    }}
                  >
                    Reset Order
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative">
          {/* Statistics Bar */}
          {viewMode === 'floor-plan' && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{getOverallStatistics().totalItems}</span>
                  <span className="text-muted-foreground">items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${getOverallStatistics().totalValue.toFixed(0)}</span>
                  <span className="text-muted-foreground">value</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{getOverallStatistics().totalRooms}</span>
                  <span className="text-muted-foreground">rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getOverallStatistics().assignedItems}</span>
                  <span className="text-muted-foreground">assigned</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Room Statistics Bar */}
          {viewMode === 'room-interior' && selectedRoom && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{getRoomStatistics(selectedRoom.name).itemCount}</span>
                  <span className="text-muted-foreground">items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${getRoomStatistics(selectedRoom.name).totalValue.toFixed(0)}</span>
                  <span className="text-muted-foreground">value</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getRoomStatistics(selectedRoom.name).categoryCount}</span>
                  <span className="text-muted-foreground">categories</span>
                </div>
              </div>
            </div>
          )}
          
          {!fabricCanvas && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Initializing canvas...</p>
              </div>
            </div>
          )}
          
          {/* Add/Manage Sub-Spaces - shown in interior view */}
          {viewMode === 'room-interior' && selectedRoom && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Storage Spaces</h3>
                <div className="flex items-center gap-2">
                  {getSubSpaces(selectedRoom.name).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {getSubSpaces(selectedRoom.name).length}
                    </Badge>
                  )}
                  {subSpaceOrder[selectedRoom.name] && subSpaceOrder[selectedRoom.name].length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = { ...subSpaceOrder };
                        delete updated[selectedRoom.name];
                        setSubSpaceOrder(updated);
                        localStorage.setItem('floorplan-subspace-order', JSON.stringify(updated));
                        toast.success("Reset storage order");
                        renderRoomInterior();
                      }}
                      className="h-6 text-xs"
                    >
                      Reset Order
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Existing Sub-Spaces List */}
              {getSubSpaces(selectedRoom.name).length > 0 && (
                <Collapsible open={storageSpacesOpen} onOpenChange={setStorageSpacesOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between h-8">
                      <span className="text-xs text-muted-foreground">
                        {storageSpacesOpen ? 'Hide' : 'Show'} existing spaces
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${storageSpacesOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 mt-2">
                      {getSubSpaces(selectedRoom.name).map((subSpace) => (
                        <div key={subSpace} className="flex items-center gap-2 bg-background p-2 rounded border">
                          {editingSubSpace === subSpace ? (
                            <>
                              <Input
                                value={editSubSpaceName}
                                onChange={(e) => setEditSubSpaceName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateSubSpace(subSpace, editSubSpaceName);
                                  } else if (e.key === "Escape") {
                                    setEditingSubSpace(null);
                                    setEditSubSpaceName("");
                                  }
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button 
                                onClick={() => updateSubSpace(subSpace, editSubSpaceName)}
                                size="sm"
                                variant="default"
                              >
                                Save
                              </Button>
                              <Button 
                                onClick={() => {
                                  setEditingSubSpace(null);
                                  setEditSubSpaceName("");
                                }}
                                size="sm"
                                variant="ghost"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 text-sm font-medium">{subSpace}</span>
                              <Badge variant="secondary" className="text-xs">
                                {allItems.filter(item => item.location === `${selectedRoom.name} > ${subSpace}`).length}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingSubSpace(subSpace);
                                  setEditSubSpaceName(subSpace);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSubSpace(subSpace)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Add New Sub-Space */}
              <div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Top Drawer, Closet, Shelf 2"
                    value={newSubSpace}
                    onChange={(e) => setNewSubSpace(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubSpace()}
                    className="h-8 text-sm"
                  />
                  <Button onClick={addSubSpace} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div
            className="border-2 border-dashed rounded-lg overflow-hidden"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const itemId = e.dataTransfer.getData("itemId");
              if (!itemId || !fabricCanvas) return;

              // Get canvas position
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;

              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              // Find which room the item was dropped in
              const droppedRoom = rooms.find(room => 
                x >= room.x && x <= room.x + room.width &&
                y >= room.y && y <= room.y + room.height
              );

              if (droppedRoom) {
                handleItemDrop(itemId, droppedRoom.name);
              } else {
                toast.error("Drop item inside a room");
              }
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </CardContent>
      </Card>

      {/* Right Sidebar - Unassigned Items & Controls */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Unassigned Items
              <Badge variant="secondary" className="ml-auto">
                {unassignedItems.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {unassignedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  All items assigned!
                </p>
              ) : (
                unassignedItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("itemId", item.id);
                    }}
                    className="flex items-center gap-3 p-3 bg-card border rounded-lg cursor-move hover:shadow-md transition-all"
                  >
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img
                        src={item.image_urls[0]}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.categories && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.categories.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Room */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Room name (e.g., Living Room)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRoom()}
            />
            <Button onClick={addRoom} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
            {rooms.length === 0 && fabricCanvas && (
              <Button 
                onClick={initializeDefaultRooms} 
                variant="default" 
                className="w-full gap-2"
              >
                <Home className="w-4 h-4" />
                Load Default Rooms
              </Button>
            )}
            <Button 
              onClick={clearFloorPlan} 
              variant="outline" 
              className="w-full gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Reset to Default
            </Button>
          </CardContent>
        </Card>

        {/* Room List */}
        {rooms.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rooms ({rooms.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center gap-2 p-2 rounded-lg group"
                    style={{ backgroundColor: room.color }}
                  >
                    <Home className="w-4 h-4" />
                    <span className="font-medium text-sm flex-1">{room.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRoom(room.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Room Details Dialog */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              {selectedRoom?.name}
            </DialogTitle>
            <DialogDescription>
              Items located in this room
            </DialogDescription>
          </DialogHeader>
          
          {/* Room Statistics */}
          {selectedRoom && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {getRoomStatistics(selectedRoom.name).itemCount}
                </div>
                <div className="text-xs text-muted-foreground">Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ${getRoomStatistics(selectedRoom.name).totalValue.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {getRoomStatistics(selectedRoom.name).categoryCount}
                </div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedRoom && allItems.filter(item => item.location?.startsWith(selectedRoom.name)).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items in this room
              </p>
            ) : (
              allItems
                .filter(item => item.location?.startsWith(selectedRoom?.name || ""))
                .map((item) => (
                  <Collapsible key={item.id}>
                    <div className="flex items-center gap-2 p-3 bg-card border rounded-lg">
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {item.location && item.location.includes(" > ") && (
                          <Archive className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.location && item.location.includes(" > ") && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {item.location.split(" > ").slice(1).join(" > ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={item.location?.split(" > ")[0] || ""}
                          onValueChange={(newRoom) => {
                            if (item.location) {
                              const currentSubSpace = item.location.includes(" > ") ? item.location.split(" > ")[1] : undefined;
                              moveItemToRoom(item.id, newRoom, item.location, currentSubSpace);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-[100px] text-xs">
                            <SelectValue placeholder="Room" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.name}>
                                {room.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedRoom && getSubSpaces(selectedRoom.name).length > 0 && (
                          <Select
                            value={item.location?.includes(" > ") ? item.location.split(" > ")[1] : "none"}
                            onValueChange={(subSpace) => {
                              if (item.location) {
                                const currentRoom = item.location.split(" > ")[0];
                                moveItemToRoom(item.id, currentRoom, item.location, subSpace === "none" ? undefined : subSpace);
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-[100px] text-xs">
                              <SelectValue placeholder="Sub-space" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {getSubSpaces(selectedRoom.name).map((subSpace) => (
                                <SelectItem key={subSpace} value={subSpace}>
                                  {subSpace}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="ml-3 mt-2 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/20">
                        <div className="flex gap-3">
                          {item.image_urls && item.image_urls.length > 0 && !item.image_urls[0]?.startsWith('emoji:') ? (
                            <img
                              src={item.image_urls[0]}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ) : item.image_urls?.[0]?.startsWith('emoji:') ? (
                            <div className="w-20 h-20 bg-background rounded flex items-center justify-center text-4xl">
                              {item.image_urls[0].replace('emoji:', '')}
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-background rounded flex items-center justify-center">
                              <Package className="w-10 h-10 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 space-y-1 text-sm">
                            {item.categories && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Category:</span> {item.categories.name}
                              </p>
                            )}
                            {item.original_price && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Value:</span> ${item.original_price}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Space Items Dialog */}
      <Dialog open={subSpaceDialogOpen} onOpenChange={setSubSpaceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              {selectedRoom?.name} - {selectedSubSpace}
            </DialogTitle>
            <DialogDescription>
              Items stored in this space
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedRoom && selectedSubSpace && allItems.filter(item => item.location === `${selectedRoom.name} > ${selectedSubSpace}`).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items in this space yet
              </p>
            ) : (
              allItems
                .filter(item => item.location === `${selectedRoom?.name} > ${selectedSubSpace}`)
                .map((item) => (
                  <Collapsible key={item.id}>
                    <div className="flex items-center gap-2 p-3 bg-card border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.name}</p>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="ml-3 mt-2 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/20">
                        <div className="flex gap-3">
                          {item.image_urls && item.image_urls.length > 0 && !item.image_urls[0]?.startsWith('emoji:') ? (
                            <img
                              src={item.image_urls[0]}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          ) : item.image_urls?.[0]?.startsWith('emoji:') ? (
                            <div className="w-20 h-20 bg-background rounded flex items-center justify-center text-4xl">
                              {item.image_urls[0].replace('emoji:', '')}
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-background rounded flex items-center justify-center">
                              <Package className="w-10 h-10 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 space-y-1 text-sm">
                            {item.categories && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Category:</span> {item.categories.name}
                              </p>
                            )}
                            {item.original_price && (
                              <p className="text-muted-foreground">
                                <span className="font-medium">Value:</span> ${item.original_price}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
