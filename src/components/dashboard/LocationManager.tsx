import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Location {
  id: string;
  location_name: string;
  usage_count: number;
}

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suggested_locations")
      .select("*")
      .order("usage_count", { ascending: false });

    if (error) {
      toast.error("Failed to load locations");
      console.error(error);
    } else {
      setLocations(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newLocation.trim()) {
      toast.error("Please enter a location name");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const { error } = await supabase
      .from("suggested_locations")
      .insert({
        location_name: newLocation.trim(),
        created_by: user.id,
      });

    if (error) {
      toast.error("Failed to add location");
      console.error(error);
    } else {
      toast.success("Location added");
      setNewLocation("");
      setOpen(false);
      fetchLocations();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("suggested_locations")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete location");
      console.error(error);
    } else {
      toast.success("Location deleted");
      fetchLocations();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Location Suggestions</CardTitle>
            <CardDescription>
              Manage suggested locations that appear in the autocomplete
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Location name (e.g., Living Room, Kitchen)"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <Button onClick={handleAdd} className="w-full">
                  Add Location
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No locations yet. Add your first location to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {locations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{location.location_name}</span>
                  {location.usage_count > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {location.usage_count}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(location.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}