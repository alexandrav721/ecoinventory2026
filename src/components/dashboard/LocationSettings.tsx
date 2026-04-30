import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

const LocationSettings = () => {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("city, state, latitude, longitude")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCity(data.city || "");
        setState(data.state || "");
        setLatitude(data.latitude || null);
        setLongitude(data.longitude || null);
      }
    } catch (error) {
      console.error("Error loading location:", error);
    }
  };

  const handleSaveLocation = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If only zip code is provided, geocode it
      if (zipCode && !city && !state) {
        await geocodeZipCode(zipCode);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          city,
          state,
          latitude,
          longitude,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Location saved successfully");
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  const geocodeZipCode = async (zip: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lon = parseFloat(location.lon);
        
        setLatitude(lat);
        setLongitude(lon);
        
        // Extract city and state from display_name if available
        const parts = location.display_name.split(", ");
        if (parts.length >= 3) {
          setCity(parts[0]);
          setState(parts[2]);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
          .from("profiles")
          .update({
            city: parts[0] || "",
            state: parts[2] || "",
            latitude: lat,
            longitude: lon,
          })
          .eq("id", user.id);

        toast.success("Location saved successfully");
      } else {
        toast.error("Could not find location for this zip code");
      }
    } catch (error) {
      console.error("Error geocoding zip code:", error);
      toast.error("Failed to lookup zip code");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        toast.success("Location detected! Click Save to update.");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to get your location.");
      }
    );
  };

  return (
    <Card className="max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-4 h-4" />
          Your Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="address" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="zipcode">Zip Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="address" className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-sm">City</Label>
                <Input
                  id="city"
                  placeholder="San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-sm">State</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGetCurrentLocation}
                className="flex-1 h-9"
                size="sm"
              >
                <MapPin className="w-3 h-3 mr-1.5" />
                Detect
              </Button>
              <Button
                onClick={handleSaveLocation}
                disabled={loading}
                className="flex-1 h-9"
                size="sm"
              >
                Save
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="zipcode" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="zipcode" className="text-sm">Zip Code</Label>
              <Input
                id="zipcode"
                placeholder="94102"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="h-9"
                maxLength={5}
              />
            </div>
            <Button
              onClick={handleSaveLocation}
              disabled={loading || !zipCode}
              className="w-full h-9"
              size="sm"
            >
              Save Zip Code
            </Button>
          </TabsContent>
        </Tabs>
        
        {latitude && longitude && (
          <p className="text-xs text-muted-foreground mt-2">
            {city && state ? `${city}, ${state}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationSettings;
