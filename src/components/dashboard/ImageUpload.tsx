import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

export function ImageUpload({ value = [], onChange, label = "Images" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from('inventory-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(fileName);

      onChange([...value, publicUrl]);
      toast.success('Image uploaded successfully');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    // If it's an uploaded image (from our storage), delete it
    if (imageUrl && imageUrl.includes('inventory-images')) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Extract file path from URL
        const urlParts = imageUrl.split('/inventory-images/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          await supabase.storage.from('inventory-images').remove([filePath]);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    onChange(value.filter(url => url !== imageUrl));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('inventory-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(fileName);

      onChange([...value, publicUrl]);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label} {value.length > 0 && `(${value.length})`}</Label>
      
      <div className="space-y-3">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          `}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag and drop an image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP up to 5MB
              </p>
            </div>
          )}
        </div>

        {value.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {value.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(imageUrl)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
