import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          created_at,
          profiles!inner(email, full_name)
        `)
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        user_id: item.user_id,
        email: item.profiles.email,
        full_name: item.profiles.full_name,
        created_at: item.created_at,
      })) || [];

      setAdmins(formattedData);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Admin Management</CardTitle>
        </div>
        <CardDescription>
          View all administrators in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : admins.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No administrators found
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Admin Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.user_id}>
                    <TableCell className="font-medium">
                      {admin.email || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {admin.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatDate(admin.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
