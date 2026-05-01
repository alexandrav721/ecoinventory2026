import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { ItemDetailSheet } from "@/components/dashboard/ItemDetailSheet";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <ItemDetailSheet
        itemId={id ?? null}
        open={!!id}
        onOpenChange={(o) => {
          if (!o) navigate(-1);
        }}
      />
    </div>
  );
};

export default ItemDetail;
