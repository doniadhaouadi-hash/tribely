import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StickyHeader } from "@/components/StickyHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { DiscoverTab } from "@/components/tabs/DiscoverTab";
import { MapTab } from "@/components/tabs/MapTab";
import { CreateTab } from "@/components/tabs/CreateTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { YouTab } from "@/components/tabs/YouTab";
import { ActivityDetailSheet } from "@/components/ActivityDetailSheet";
import { isTabKey, type TabKey } from "@/lib/tabs";
import { useActivities } from "@/hooks/useActivities";
import type { MockActivity } from "@/data/activities";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activityParam = searchParams.get("activity");
  const activeTab: TabKey = isTabKey(tabParam) ? tabParam : "discover";
  const { activities } = useActivities();

  const [activeActivity, setActiveActivity] = useState<MockActivity | null>(null);

  useEffect(() => {
    if (!isTabKey(tabParam)) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", "discover");
      setSearchParams(next, { replace: true });
    }
  }, [tabParam, searchParams, setSearchParams]);

  // Deep link: open shared activity once it's loaded
  useEffect(() => {
    if (!activityParam) return;
    const found = activities.find((a) => a.id === activityParam);
    if (found) {
      setActiveActivity(found);
      const next = new URLSearchParams(searchParams);
      next.delete("activity");
      setSearchParams(next, { replace: true });
    }
  }, [activityParam, activities, searchParams, setSearchParams]);

  const setActiveTab = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: false });
  };

  const handleOpenActivity = (a: MockActivity) => setActiveActivity(a);

  const content = useMemo(() => {
    switch (activeTab) {
      case "discover":
        return (
          <DiscoverTab
            onSwitchToMap={() => setActiveTab("map")}
            onOpenActivity={handleOpenActivity}
            onHostClick={() => setActiveTab("create")}
          />
        );
      case "map":
        return <MapTab onOpenActivity={handleOpenActivity} />;
      case "create":   return <CreateTab />;
      case "chat":     return <ChatTab />;
      case "you":      return <YouTab />;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const isMap = activeTab === "map";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StickyHeader />
      <main
        className={`flex-1 max-w-md w-full mx-auto pb-32 ${isMap ? "px-4 pt-2" : "px-4 pt-2"}`}
      >
        <div key={activeTab} className="animate-fade-in">
          {content}
        </div>
      </main>
      <BottomNavigation active={activeTab} onChange={setActiveTab} />
      <ActivityDetailSheet
        activity={activeActivity}
        onOpenChange={(open) => !open && setActiveActivity(null)}
      />
    </div>
  );
};

export default Index;
