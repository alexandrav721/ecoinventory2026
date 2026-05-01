import AppHeader from "@/components/AppHeader";
import { PickleStyleSearch } from "@/components/community/PickleStyleSearch";
import { DemoNearbyItems } from "@/components/community/DemoNearbyItems";
import { useDemo } from "@/contexts/DemoContext";

const Community = () => {
  const { isDemoMode } = useDemo();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        {isDemoMode ? (
          <div className="container mx-auto px-4 py-8">
            <DemoNearbyItems />
          </div>
        ) : (
          <PickleStyleSearch />
        )}
      </main>
    </div>
  );
};

export default Community;
