import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { MapPin, User, Users, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionManager } from "@/components/dashboard/SubscriptionManager";
import { UserProfileSettings } from "@/components/dashboard/UserProfileSettings";

const ProfileSettings = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: "",
    public_display_name: "",
    friends_display_name: "",
    avatar_url: "",
    public_avatar_url: "",
    friends_avatar_url: "",
    location_visible_to_friends: true,
    location_visible_to_public: false
  });
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          public_display_name: data.public_display_name || "",
          friends_display_name: data.friends_display_name || "",
          avatar_url: data.avatar_url || "",
          public_avatar_url: data.public_avatar_url || "",
          friends_avatar_url: data.friends_avatar_url || "",
          location_visible_to_friends: data.location_visible_to_friends ?? true,
          location_visible_to_public: data.location_visible_to_public ?? false
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "avatar_url" | "public_avatar_url" | "friends_avatar_url"
  ) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${field}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("inventory-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("inventory-images")
        .getPublicUrl(filePath);

      setProfile({ ...profile, [field]: publicUrl });
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Customize how you appear to the public and to your followers
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Set different display names and pictures for public viewing and for your followers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="personalization" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Personalization
                  </TabsTrigger>
                  <TabsTrigger value="public" className="gap-2">
                    <User className="w-4 h-4" />
                    Public
                  </TabsTrigger>
                  <TabsTrigger value="friends" className="gap-2">
                    <Users className="w-4 h-4" />
                    Followers
                  </TabsTrigger>
                  <TabsTrigger value="location" className="gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </TabsTrigger>
                  <TabsTrigger value="subscription" className="gap-2">
                    <CreditCard className="w-4 h-4" />
                    Subscription
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name (Default)</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Your full name"
                    />
                    <p className="text-sm text-muted-foreground">
                      Used when specific display names aren't set
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Avatar</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>{profile.full_name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "avatar_url")}
                          disabled={uploading}
                          className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Used when specific avatars aren't set
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="personalization" className="space-y-6 mt-6">
                  <UserProfileSettings />
                </TabsContent>

                <TabsContent value="public" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="public_display_name">Public Display Name</Label>
                    <Input
                      id="public_display_name"
                      value={profile.public_display_name}
                      onChange={(e) => setProfile({ ...profile, public_display_name: e.target.value })}
                      placeholder="How you appear to the public"
                    />
                    <p className="text-sm text-muted-foreground">
                      This is shown to people who don't follow you
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Public Avatar</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile.public_avatar_url || profile.avatar_url} />
                        <AvatarFallback>
                          {(profile.public_display_name || profile.full_name)?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "public_avatar_url")}
                          disabled={uploading}
                          className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Shown to people who don't follow you
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="friends" className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="friends_display_name">Followers Display Name</Label>
                    <Input
                      id="friends_display_name"
                      value={profile.friends_display_name}
                      onChange={(e) => setProfile({ ...profile, friends_display_name: e.target.value })}
                      placeholder="How you appear to your followers"
                    />
                    <p className="text-sm text-muted-foreground">
                      This is shown only to people who follow you
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Followers Avatar</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile.friends_avatar_url || profile.avatar_url} />
                        <AvatarFallback>
                          {(profile.friends_display_name || profile.full_name)?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "friends_avatar_url")}
                          disabled={uploading}
                          className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Shown only to people who follow you
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="location-friends" className="text-base font-medium">
                          Share Location with Friends
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Allow your friends to see your city and state
                        </p>
                      </div>
                      <Switch
                        id="location-friends"
                        checked={profile.location_visible_to_friends}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, location_visible_to_friends: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor="location-public" className="text-base font-medium">
                          Share Location with Public
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Allow everyone in the community to see your city and state
                        </p>
                      </div>
                      <Switch
                        id="location-public"
                        checked={profile.location_visible_to_public}
                        onCheckedChange={(checked) =>
                          setProfile({ ...profile, location_visible_to_public: checked })
                        }
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-6 mt-6">
                  <SubscriptionManager />
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex justify-end">
                <Button onClick={handleUpdateProfile}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
