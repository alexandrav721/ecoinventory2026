import AppHeader from "@/components/AppHeader";
import { PickleStyleSearch } from "@/components/community/PickleStyleSearch";

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <PickleStyleSearch />
      </main>
    </div>
  );
};

export default Community;
