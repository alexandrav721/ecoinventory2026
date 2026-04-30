import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { useTranslation } from "react-i18next";

interface CsvRow {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  original_price?: string;
  purchase_date?: string;
  quantity?: string;
  condition?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  usage_frequency?: string;
}

export const CsvUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: number; failed: number } | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const downloadTemplate = () => {
    const template = [
      ["name", "brand", "description", "category", "original_price", "purchase_date", "quantity", "condition", "color", "size", "dimensions", "usage_frequency"],
      ["iPhone 15", "Apple", "Latest smartphone", "Electronics", "999.99", "2024-01-15", "1", "New", "Black", "6.1 inch", "147.6 x 71.6 x 7.8 mm", "Daily"],
      ["Desk Chair", "Herman Miller", "Ergonomic office chair", "Furniture", "1200.00", "2023-06-10", "1", "Good", "Gray", "", "68 x 68 x 95 cm", "Daily"],
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: t('csv.templateDownloaded'),
      description: t('csv.templateDesc'),
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: t('csv.error'),
          description: t('csv.mustBeLoggedIn'),
          variant: "destructive",
        });
        return;
      }

      // Parse CSV
      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          let successCount = 0;
          let failedCount = 0;

          // Get all categories for mapping
          const { data: categories } = await supabase
            .from("categories")
            .select("id, name");

          const categoryMap = new Map(
            categories?.map(cat => [cat.name.toLowerCase(), cat.id]) || []
          );

          for (const row of results.data) {
            try {
              if (!row.name || row.name.trim() === "") {
                failedCount++;
                continue;
              }

              const categoryId = row.category 
                ? categoryMap.get(row.category.toLowerCase()) 
                : null;

              const itemData = {
                user_id: user.id,
                name: row.name.trim(),
                brand: row.brand?.trim() || null,
                description: row.description?.trim() || null,
                category_id: categoryId || null,
                original_price: row.original_price ? parseFloat(row.original_price) : null,
                purchase_date: row.purchase_date || null,
                quantity: row.quantity ? parseInt(row.quantity) : 1,
                condition: row.condition?.trim() || null,
                color: row.color?.trim() || null,
                size: row.size?.trim() || null,
                dimensions: row.dimensions?.trim() || null,
                usage_frequency: row.usage_frequency?.trim() || null,
              };

              const { error } = await supabase
                .from("inventory_items")
                .insert(itemData);

              if (error) {
                console.error("Error inserting item:", error);
                failedCount++;
              } else {
                successCount++;
              }
            } catch (error) {
              console.error("Error processing row:", error);
              failedCount++;
            }
          }

          setUploadStatus({ success: successCount, failed: failedCount });
          setIsUploading(false);

          if (successCount > 0) {
            toast({
              title: t('csv.uploadComplete'),
              description: `${t('csv.uploadSuccess', { count: successCount })}${failedCount > 0 ? `, ${t('csv.uploadFailed', { count: failedCount })}` : ""}.`,
            });
          } else {
            toast({
              title: t('csv.uploadError'),
              description: t('csv.noItemsImported'),
              variant: "destructive",
            });
          }

          // Reset file input
          event.target.value = "";
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          toast({
            title: t('csv.error'),
            description: t('csv.parseError'),
            variant: "destructive",
          });
          setIsUploading(false);
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: t('csv.error'),
        description: t('csv.uploadErrorGeneric'),
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.bulkImport')}</CardTitle>
        <CardDescription>
          {t('dashboard.bulkImportDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('dashboard.downloadTemplate')}
          </Button>

          <div className="flex-1">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button
                variant="default"
                disabled={isUploading}
                className="w-full"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? t('dashboard.uploading') : t('dashboard.uploadCsv')}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {uploadStatus && (
          <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
            {uploadStatus.success > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{t('csv.itemsSuccess', { count: uploadStatus.success })}</span>
              </div>
            )}
            {uploadStatus.failed > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{t('csv.itemsFailed', { count: uploadStatus.failed })}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">{t('csv.formatRequirements')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t('csv.requiredColumn')} <code className="bg-muted px-1 rounded">name</code></li>
            <li>{t('csv.optionalColumns')}</li>
            <li>{t('csv.categoryMatch')}</li>
            <li>{t('csv.dateFormat')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
