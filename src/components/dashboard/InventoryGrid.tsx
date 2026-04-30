import { useEffect, useState, useMemo } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, Pencil, Trash2, ImageIcon, Download, Copy, ArrowUpDown, ArrowUp, ArrowDown, GripVertical, ChevronDown, ChevronRight, Grid3x3, Tag, Palette, PackageCheck, Minimize2, Maximize2, AlertTriangle, List, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import ItemDetailDialog from "./ItemDetailDialog";
import BulkEditDialog from "./BulkEditDialog";
import { BulkActionBar } from "./BulkActionBar";
import ColumnSettings, { ColumnConfig } from "./ColumnSettings";
import InventorySummaryBar from "./InventorySummaryBar";
import QuickAddTemplates from "./QuickAddTemplates";

import InventoryLocationView from "./InventoryLocationView";
import { formatCurrency } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuirkyLoader } from "@/components/QuirkyLoader";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "react-i18next";
import { useDemo } from "@/contexts/DemoContext";
import { useExcessInsights } from "@/hooks/useExcessInsights";

type ViewMode = 'list' | 'location';

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  quantity: number;
  original_price: number | null;
  purchase_date: string | null;
  image_urls: string[] | null;
  condition: string | null;
  usage_frequency: string | null;
  is_available_for_sharing: boolean;
  sharing_level: string | null;
  sharing_price: number | null;
  brand: string | null;
  color: string | null;
  dimensions: string | null;
  size: string | null;
  is_donated: boolean | null;
  is_sold: boolean | null;
  donated_price: number | null;
  sold_price: number | null;
  donated_date: string | null;
  sold_date: string | null;
  is_eliminated: boolean | null;
  eliminated_date: string | null;
  tags: string[];
  location: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
}

type SortField = 'name' | 'category' | 'brand' | 'color' | 'quantity' | 'original_price' | 'condition';
type SortOrder = 'asc' | 'desc' | null;
type GroupField = 'none' | 'category' | 'brand' | 'color' | 'condition';

const COLUMN_STORAGE_KEY = "inventory-table-columns";
const SORT_STORAGE_KEY = "inventory-table-sort";
const GROUP_STORAGE_KEY = "inventory-table-group";

interface DraggableTableHeadProps {
  column: ColumnConfig;
  onSort: (field: SortField) => void;
  getSortIcon: (field: SortField) => JSX.Element;
  onSelectAll?: (checked: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
}

const DraggableTableHead = ({ column, onSort, getSortIcon, onSelectAll, allSelected }: DraggableTableHeadProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (column.id === 'checkbox') {
    return (
      <TableHead ref={setNodeRef} style={style} className="w-12">
        <Checkbox
          checked={allSelected || false}
          onCheckedChange={onSelectAll}
          aria-label="Select all items"
        />
      </TableHead>
    );
  }

  if (column.id === 'image') {
    return (
      <TableHead ref={setNodeRef} style={style} className="w-16">
        <div className="flex items-center gap-1">
          <GripVertical className="w-4 h-4 cursor-grab text-muted-foreground" {...listeners} {...attributes} />
          <span>{column.label}</span>
        </div>
      </TableHead>
    );
  }

  if (column.id === 'actions') {
    return (
      <TableHead ref={setNodeRef} style={style} className="text-right">
        <div className="flex items-center justify-end gap-1">
          <GripVertical className="w-4 h-4 cursor-grab text-muted-foreground" {...listeners} {...attributes} />
          <span>{column.label}</span>
        </div>
      </TableHead>
    );
  }

  if (column.sortable) {
    return (
      <TableHead ref={setNodeRef} style={style}>
        <div className="flex items-center gap-1">
          <GripVertical className="w-4 h-4 cursor-grab text-muted-foreground flex-shrink-0" {...listeners} {...attributes} />
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => onSort(column.id as SortField)}
          >
            {column.label}
            {getSortIcon(column.id as SortField)}
          </Button>
        </div>
      </TableHead>
    );
  }

  return (
    <TableHead ref={setNodeRef} style={style}>
      <div className="flex items-center gap-1">
        <GripVertical className="w-4 h-4 cursor-grab text-muted-foreground" {...listeners} {...attributes} />
        <span>{column.label}</span>
      </div>
    </TableHead>
  );
};

const InventoryGrid = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [sharingFilter, setSharingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [groupBy, setGroupBy] = useState<GroupField>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { t } = useTranslation();
  const { isDemoMode, demoItems, demoCategories } = useDemo();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const { getExcessForItem } = useExcessInsights(currentUserId);

  // Compute summary stats
  const summaryStats = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + ((item.original_price || 0) * item.quantity), 0);
    const uniqueCategories = new Set(items.map(item => item.category_id).filter(Boolean));
    const uniqueLocations = new Set(items.map(item => item.location).filter(Boolean));
    return {
      totalItems,
      totalValue,
      categoryCount: uniqueCategories.size,
      locationCount: uniqueLocations.size,
    };
  }, [items]);

  // Column configuration
  const getInitialColumns = (): ColumnConfig[] => {
    const defaultColumns = [
      { id: 'checkbox', label: '', visible: true, sortable: false },
      { id: 'image', label: 'Image', visible: true, sortable: false },
      { id: 'name', label: 'Name', visible: true, sortable: true },
      { id: 'tags', label: 'Tags', visible: true, sortable: false },
      { id: 'category', label: 'Category', visible: true, sortable: true },
      { id: 'brand', label: 'Brand', visible: true, sortable: true },
      { id: 'color', label: 'Color', visible: true, sortable: true },
      { id: 'quantity', label: 'Qty', visible: true, sortable: true },
      { id: 'original_price', label: 'Price', visible: true, sortable: true },
      { id: 'condition', label: 'Condition', visible: true, sortable: true },
      { id: 'actions', label: 'Actions', visible: true, sortable: false },
    ];

    try {
      const stored = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (stored) {
        const storedColumns = JSON.parse(stored);
        // Ensure checkbox column exists (might be missing from old localStorage)
        const hasCheckbox = storedColumns.some((col: ColumnConfig) => col.id === 'checkbox');
        if (!hasCheckbox) {
          // Add checkbox as first column if missing
          return [defaultColumns[0], ...storedColumns];
        }
        return storedColumns;
      }
    } catch (error) {
      console.error("Error reading column config:", error);
    }
    return defaultColumns;
  };

  const [columns, setColumns] = useState<ColumnConfig[]>(getInitialColumns);

  // Load sort and group preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SORT_STORAGE_KEY);
      if (stored) {
        const { field, order } = JSON.parse(stored);
        setSortField(field);
        setSortOrder(order);
      }
    } catch (error) {
      console.error("Error reading sort config:", error);
    }

    try {
      const storedGroup = localStorage.getItem(GROUP_STORAGE_KEY);
      if (storedGroup) {
        setGroupBy(JSON.parse(storedGroup));
      }
    } catch (error) {
      console.error("Error reading group config:", error);
    }
  }, []);

  // Save column preferences
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columns));
    } catch (error) {
      console.error("Error saving column config:", error);
    }
  }, [columns]);

  // Save sort preferences
  useEffect(() => {
    if (sortField && sortOrder) {
      try {
        localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ field: sortField, order: sortOrder }));
      } catch (error) {
        console.error("Error saving sort config:", error);
      }
    }
  }, [sortField, sortOrder]);

  // Save group preferences
  useEffect(() => {
    try {
      localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groupBy));
    } catch (error) {
      console.error("Error saving group config:", error);
    }
  }, [groupBy]);

  useEffect(() => {
    // In demo mode, use demo data directly
    if (isDemoMode) {
      setItems(demoItems as unknown as InventoryItem[]);
      setCategories(demoCategories as unknown as Category[]);
      setLoading(false);
      return;
    }

    fetchData();

    // Subscribe to realtime changes
    const itemsChannel = supabase
      .channel("inventory_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const categoriesChannel = supabase
      .channel("category_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, [isDemoMode, demoItems, demoCategories]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Set user ID for excess insights hook
      setCurrentUserId(user.id);

      const [itemsResult, categoriesResult] = await Promise.all([
        supabase
          .from("inventory_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_donated", false)
          .eq("is_sold", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .order("name"),
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setItems(itemsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItemId) return;
    
    try {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", deletingItemId);

      if (error) throw error;
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDuplicate = async (item: InventoryItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("inventory_items").insert([
        {
          name: `${item.name} (Copy)`,
          description: item.description,
          brand: item.brand,
          color: item.color,
          dimensions: item.dimensions,
          size: item.size,
          user_id: user.id,
          original_price: item.original_price,
          purchase_date: item.purchase_date,
          image_urls: item.image_urls,
          category_id: item.category_id,
          quantity: item.quantity,
          condition: item.condition,
          usage_frequency: item.usage_frequency,
          is_available_for_sharing: item.is_available_for_sharing,
          sharing_level: item.sharing_level || "private",
          is_donated: false,
          is_sold: false,
        },
      ]);

      if (error) throw error;

      toast.success("Item duplicated successfully!");
      fetchData();
    } catch (error: any) {
      console.error("Error duplicating item:", error);
      toast.error(error.message || "Failed to duplicate item");
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(sortedItems.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkEdit = () => {
    if (selectedItems.size === 0) return;
    setBulkEditDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const itemIds = Array.from(selectedItems);
      
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .in("id", itemIds);

      if (error) throw error;

      toast.success(`Deleted ${itemIds.length} ${itemIds.length === 1 ? 'item' : 'items'}`);
      setSelectedItems(new Set());
      setBulkDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting items:", error);
      toast.error("Failed to delete items");
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const uniqueBrands = Array.from(new Set(items.map(item => item.brand).filter(Boolean))) as string[];
  const uniqueConditions = Array.from(new Set(items.map(item => item.condition).filter(Boolean))) as string[];

  const filteredItems = items.filter(item => {
    if (categoryFilter !== "all" && item.category_id !== categoryFilter) return false;
    if (brandFilter !== "all" && item.brand !== brandFilter) return false;
    if (conditionFilter !== "all" && item.condition !== conditionFilter) return false;
    if (sharingFilter !== "all" && item.sharing_level !== sharingFilter) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sorting logic
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'category':
        aValue = getCategoryName(a.category_id).toLowerCase();
        bValue = getCategoryName(b.category_id).toLowerCase();
        break;
      case 'brand':
        aValue = (a.brand || '').toLowerCase();
        bValue = (b.brand || '').toLowerCase();
        break;
      case 'color':
        aValue = (a.color || '').toLowerCase();
        bValue = (b.color || '').toLowerCase();
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'original_price':
        aValue = a.original_price || 0;
        bValue = b.original_price || 0;
        break;
      case 'condition':
        aValue = (a.condition || '').toLowerCase();
        bValue = (b.condition || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order or clear
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible } : col
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        
        return newItems;
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    if (sortOrder === 'asc') return <ArrowUp className="w-4 h-4 ml-1" />;
    return <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const getGroupValue = (item: InventoryItem, field: GroupField): string => {
    switch (field) {
      case 'category':
        return getCategoryName(item.category_id);
      case 'brand':
        return item.brand || 'No Brand';
      case 'color':
        return item.color || 'No Color';
      case 'condition':
        return item.condition || 'No Condition';
      default:
        return '';
    }
  };

  const groupedItems = (() => {
    if (groupBy === 'none') {
      return { 'All Items': sortedItems };
    }

    const groups: Record<string, InventoryItem[]> = {};
    sortedItems.forEach(item => {
      const groupValue = getGroupValue(item, groupBy);
      if (!groups[groupValue]) {
        groups[groupValue] = [];
      }
      groups[groupValue].push(item);
    });

    return groups;
  })();

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const collapseAllGroups = () => {
    const allGroupNames = Object.keys(groupedItems);
    setCollapsedGroups(new Set(allGroupNames));
  };

  const expandAllGroups = () => {
    setCollapsedGroups(new Set());
  };

  const exportToCSV = () => {
    if (filteredItems.length === 0) {
      toast.error("No items to export");
      return;
    }

    // Define CSV headers
    const headers = [
      "Name",
      "Category",
      "Brand",
      "Color",
      "Size",
      "Quantity",
      "Original Price",
      "Condition",
      "Purchase Date",
      "Description",
      "Dimensions",
      "Image URL"
    ];

    // Convert items to CSV rows
    const rows = filteredItems.map(item => [
      item.name,
      getCategoryName(item.category_id),
      item.brand || "",
      item.color || "",
      item.size || "",
      item.quantity,
      item.original_price || "",
      item.condition || "",
      item.purchase_date || "",
      item.description || "",
      item.dimensions || "",
      item.image_urls?.[0] || ""
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(cell => 
          // Escape quotes and wrap in quotes if contains comma or quote
          typeof cell === 'string' && (cell.includes(",") || cell.includes('"'))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(",")
      )
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${filteredItems.length} items to CSV`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Summary Bar */}
        <InventorySummaryBar
          totalItems={summaryStats.totalItems}
          totalValue={summaryStats.totalValue}
          categoryCount={summaryStats.categoryCount}
          locationCount={summaryStats.locationCount}
        />

        {/* Quick Add Templates */}
        <QuickAddTemplates />

        {/* Main Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg">My Stuff</CardTitle>
                {/* View Mode Toggle */}
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(value) => value && setViewMode(value as ViewMode)}
                  className="bg-muted rounded-lg p-1"
                >
                  <ToggleGroupItem value="list" aria-label="List view" className="gap-1.5 data-[state=on]:bg-background">
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">List</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="location" aria-label="Location view" className="gap-1.5 data-[state=on]:bg-background">
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Rooms</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex gap-2">
                {viewMode === 'list' && (
                  <ColumnSettings 
                    columns={columns}
                    onColumnVisibilityChange={handleColumnVisibilityChange}
                  />
                )}
                <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search your stuff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.filter(c => !c.parent_id).map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-[120px] h-10">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(categoryFilter !== "all" || brandFilter !== "all" || conditionFilter !== "all" || sharingFilter !== "all" || searchQuery) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-10"
                    onClick={() => {
                      setCategoryFilter("all");
                      setBrandFilter("all");
                      setConditionFilter("all");
                      setSharingFilter("all");
                      setSearchQuery("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* List View Grouping Controls */}
            {viewMode === 'list' && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Group by:</span>
                <ToggleGroup 
                  type="single" 
                  value={groupBy} 
                  onValueChange={(value) => value && setGroupBy(value as GroupField)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="none" aria-label="No grouping" className="gap-1.5 h-8 text-xs">
                    <Grid3x3 className="w-3.5 h-3.5" />
                    None
                  </ToggleGroupItem>
                  <ToggleGroupItem value="category" aria-label="Group by category" className="gap-1.5 h-8 text-xs">
                    <Package className="w-3.5 h-3.5" />
                    Category
                  </ToggleGroupItem>
                  <ToggleGroupItem value="brand" aria-label="Group by brand" className="gap-1.5 h-8 text-xs">
                    <Tag className="w-3.5 h-3.5" />
                    Brand
                  </ToggleGroupItem>
                </ToggleGroup>
                
                {groupBy !== 'none' && (
                  <div className="ml-auto">
                    {collapsedGroups.size === 0 ? (
                      <Button variant="ghost" size="sm" onClick={collapseAllGroups} className="gap-1.5 h-8 text-xs">
                        <Minimize2 className="w-3.5 h-3.5" />
                        Collapse
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={expandAllGroups} className="gap-1.5 h-8 text-xs">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Expand
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Content Views */}
            {sortedItems.length === 0 ? (
              <EmptyState
                icon={<Package className="w-16 h-16" />}
                title={items.length === 0 ? t('empty.inventory.title') : t('empty.search.title')}
                description={
                  items.length === 0
                    ? t('empty.inventory.description')
                    : t('empty.search.description')
                }
              />
            ) : viewMode === 'location' ? (
              <InventoryLocationView
                items={sortedItems}
                onItemClick={(item) => setViewingItem(item as unknown as InventoryItem)}
              />
            ) : (
            <div className="border rounded-lg overflow-hidden">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableContext
                        items={columns.filter(c => c.visible).map(col => col.id)}
                        strategy={horizontalListSortingStrategy}
                      >
                        {columns.filter(c => c.visible).map((column) => {
                          const allVisibleSelected = sortedItems.length > 0 && sortedItems.every(item => selectedItems.has(item.id));
                          
                          return (
                            <DraggableTableHead 
                              key={column.id} 
                              column={column} 
                              onSort={handleSort} 
                              getSortIcon={getSortIcon}
                              onSelectAll={handleSelectAll}
                              allSelected={allVisibleSelected}
                            />
                          );
                        })}
                      </SortableContext>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedItems).map(([groupName, items]) => {
                      const isCollapsed = collapsedGroups.has(groupName);
                      const showGroupHeader = groupBy !== 'none';
                      const visibleColumns = columns.filter(c => c.visible);

                      return (
                        <React.Fragment key={groupName}>
                          {showGroupHeader && (
                            <TableRow 
                              className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
                              onClick={() => toggleGroup(groupName)}
                            >
                              <TableCell colSpan={visibleColumns.length} className="font-semibold">
                                <div className="flex items-center gap-2">
                                  {isCollapsed ? (
                                    <ChevronRight className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                  <span>{groupName}</span>
                                  <span className="text-muted-foreground text-sm font-normal">
                                    ({items.length} {items.length === 1 ? 'item' : 'items'})
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {!isCollapsed && items.map((item) => (
                            <TableRow 
                              key={item.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setViewingItem(item)}
                            >
                              {visibleColumns.map((column) => {

                                switch (column.id) {
                                  case 'checkbox':
                                    return (
                                      <TableCell key={column.id} onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                          checked={selectedItems.has(item.id)}
                                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                                        />
                                      </TableCell>
                                    );
                                  
                                  case 'image':
                                    return (
                                      <TableCell key={column.id} onClick={(e) => e.stopPropagation()}>
                                        {item.image_urls && item.image_urls.length > 0 && item.image_urls[0] ? (
                                          item.image_urls[0].startsWith("emoji:") ? (
                                            <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center shadow-sm">
                                              <span className="text-4xl">{item.image_urls[0].slice(6)}</span>
                                            </div>
                                          ) : (
                                            <div className="relative group">
                                              <img
                                                src={item.image_urls[0]}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded-xl cursor-pointer shadow-sm ring-1 ring-border/50 group-hover:ring-primary/50 group-hover:shadow-md transition-all"
                                                onClick={() => setImagePreview(item.image_urls![0])}
                                              />
                                              {item.image_urls.length > 1 && (
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                                  +{item.image_urls.length - 1}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        ) : (
                                          <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center shadow-sm">
                                            <ImageIcon className="w-7 h-7 text-muted-foreground/50" />
                                          </div>
                                        )}
                                      </TableCell>
                                    );
                                  
                                  case 'name':
                                    const excessInfo = getExcessForItem(item.id);
                                    return (
                                      <TableCell key={column.id}>
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{item.name}</span>
                                            {excessInfo && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Badge 
                                                    variant="outline" 
                                                    className={`text-xs gap-1 cursor-help ${
                                                      excessInfo.level === 'excessive' 
                                                        ? 'border-orange-500 text-orange-600 bg-orange-500/10' 
                                                        : 'border-amber-500 text-amber-600 bg-amber-500/10'
                                                    }`}
                                                  >
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {excessInfo.level === 'excessive' ? 'Excess' : 'Over'}
                                                  </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                  <p className="font-medium mb-1">
                                                    You have {excessInfo.quantity} {excessInfo.itemName}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    Most households only need {excessInfo.typical}-{excessInfo.max}. 
                                                    Consider donating {Math.max(0, excessInfo.quantity - excessInfo.max)} extras!
                                                  </p>
                                                </TooltipContent>
                                              </Tooltip>
                                            )}
                                          </div>
                                          {/* Secondary info line */}
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {item.brand && <span>{item.brand}</span>}
                                            {item.brand && item.location && <span>•</span>}
                                            {item.location && (
                                              <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {item.location}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                    );
                                  
                                  case 'tags':
                                    return (
                                      <TableCell key={column.id}>
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                          {item.tags && item.tags.length > 0 ? (
                                            <>
                                              {item.tags.slice(0, 3).map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                  {tag}
                                                </Badge>
                                              ))}
                                              {item.tags.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                  +{item.tags.length - 3}
                                                </Badge>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-muted-foreground text-xs">No tags</span>
                                          )}
                                        </div>
                                      </TableCell>
                                    );
                                  
                                  case 'category':
                                    const categoryName = getCategoryName(item.category_id);
                                    const categoryColors: Record<string, string> = {
                                      'Electronics': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                                      'Clothing': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
                                      'Kitchen': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
                                      'Books': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                                      'Sports': 'bg-green-500/10 text-green-600 border-green-500/20',
                                      'Tools': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
                                      'Furniture': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                                      'Toys': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
                                      'Garden': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                                      'Office': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                                    };
                                    const colorClass = Object.entries(categoryColors).find(
                                      ([key]) => categoryName.toLowerCase().includes(key.toLowerCase())
                                    )?.[1] || 'bg-muted text-muted-foreground border-border';
                                    
                                    return (
                                      <TableCell key={column.id}>
                                        <Badge 
                                          variant="outline" 
                                          className={`font-medium ${colorClass}`}
                                        >
                                          {categoryName}
                                        </Badge>
                                      </TableCell>
                                    );
                                  
                                  case 'brand':
                                    return (
                                      <TableCell key={column.id}>
                                        {item.brand || "-"}
                                      </TableCell>
                                    );
                                  
                                  case 'color':
                                    return (
                                      <TableCell key={column.id}>
                                        {item.color || "-"}
                                      </TableCell>
                                    );
                                  
                                  case 'quantity':
                                    return (
                                      <TableCell key={column.id}>
                                        {item.quantity}
                                      </TableCell>
                                    );
                                  
                                  case 'original_price':
                                    return (
                                      <TableCell key={column.id}>
                                        {item.original_price ? formatCurrency(item.original_price) : "-"}
                                      </TableCell>
                                    );
                                  
                                  case 'condition':
                                    const conditionColors: Record<string, string> = {
                                      'new': 'bg-green-500/10 text-green-600',
                                      'like new': 'bg-emerald-500/10 text-emerald-600',
                                      'good': 'bg-blue-500/10 text-blue-600',
                                      'fair': 'bg-amber-500/10 text-amber-600',
                                      'poor': 'bg-red-500/10 text-red-600',
                                    };
                                    const conditionClass = item.condition 
                                      ? conditionColors[item.condition.toLowerCase()] || 'bg-muted text-muted-foreground'
                                      : '';
                                    return (
                                      <TableCell key={column.id}>
                                        {item.condition ? (
                                          <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium capitalize ${conditionClass}`}>
                                            {item.condition}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                    );
                                  
                                  case 'actions':
                                    return (
                                      <TableCell key={column.id} className="text-right">
                                        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDuplicate(item)}
                                            title="Duplicate item"
                                          >
                                            <Copy className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate(`/dashboard/edit-item/${item.id}`)}
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeletingItemId(item.id)}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    );
                                  
                                  default:
                                    return null;
                                }
                              })}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
              </Table>
            </DndContext>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
      <BulkActionBar
        selectedCount={selectedItems.size}
        onEdit={handleBulkEdit}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedItems(new Set())}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        selectedItemIds={Array.from(selectedItems)}
        onSuccess={() => {
          fetchData();
          setSelectedItems(new Set());
        }}
      />


      {/* View Dialog */}
      {viewingItem && (
        <ItemDetailDialog
          item={viewingItem}
          open={!!viewingItem}
          onOpenChange={(open) => !open && setViewingItem(null)}
          onItemUpdated={fetchData}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItemId} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('errors.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this item from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.size} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected items from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={(open) => !open && setImagePreview(null)}>
        <DialogContent className="max-w-3xl">
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Item preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default InventoryGrid;
