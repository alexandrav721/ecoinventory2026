import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Sparkles, X } from "lucide-react";

export function UserProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    gender: '',
    age: '',
    interests: [] as string[]
  });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('gender, age, interests')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          gender: data.gender || '',
          age: data.age?.toString() || '',
          interests: data.interests || []
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          gender: profile.gender || null,
          age: profile.age ? parseInt(profile.age) : null,
          interests: profile.interests.length > 0 ? profile.interests : null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addInterest = () => {
    if (!newInterest.trim()) return;
    if (profile.interests.includes(newInterest.trim())) {
      toast.error('Interest already added');
      return;
    }
    setProfile({
      ...profile,
      interests: [...profile.interests, newInterest.trim()]
    });
    setNewInterest('');
  };

  const removeInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(i => i !== interest)
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Help us personalize your catalog recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={profile.gender}
            onValueChange={(value) => setProfile({ ...profile, gender: value })}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min="0"
            max="120"
            placeholder="Enter your age"
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
          />
        </div>

        {/* Interests */}
        <div className="space-y-2">
          <Label>Interests & Hobbies</Label>
          <p className="text-sm text-muted-foreground">
            Add interests to help us recommend relevant items
          </p>
          
          {/* Interest Input */}
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Cooking, Sports, Gaming..."
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addInterest();
                }
              }}
            />
            <Button type="button" onClick={addInterest}>
              Add
            </Button>
          </div>

          {/* Interest Tags */}
          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="secondary" className="text-sm">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(interest)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Profile Settings'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Tip: Your profile information helps us recommend household items that match your lifestyle and interests.
        </p>
      </CardContent>
    </Card>
  );
}
