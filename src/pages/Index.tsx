import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StickyHeader } from "@/components/StickyHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { GlassBackground } from "@/components/GlassBackground";
import { DiscoverTab } from "@/components/tabs/DiscoverTab";
import { MapTab } from "@/components/tabs/MapTab";
import { CreateTab } from "@/components/tabs/CreateTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { YouTab } from "@/components/tabs/YouTab";
import { ActivityDetailSheet } from "@/components/ActivityDetailSheet";
import { LocationPickerSheet } from "@/components/LocationPickerSheet";
import { isTabKey, type TabKey } from "@/lib/tabs";
import { useActivities } from "@/hooks/useActivities";
import { fetchActivityById } from "@/lib/activitiesApi";
import { toast } from "sonner";
import type { MockActivity } from "@/data/activities";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activityParam = searchParams.get("activity");
  const activeTab: TabKey = isTabKey(tabParam) ? tabParam : "discover";
  const { activities, loading: activitiesLoading } = useActivities();

  const [activeActivity, setActiveActivity] = useState<MockActivity | null>(null);

  useEffect(() => {
    if (!isTabKey(tabParam)) {
      const next = new URLSearchParams(searchParams);
      next.set("tab", "discover");
      setSearchParams(next, { replace: true });
    }
  }, [tabParam, searchParams, setSearchParams]);

  // Deep link: open shared activity once the feed is loaded. Activities that
  // aren't in the feed (e.g. already started) are fetched by id.
  useEffect(() => {
    if (!activityParam || activitiesLoading) return;
    let cancelled = false;
    const clearParam = () => {
      const next = new URLSearchParams(searchParams);
      next.delete("activity");
      setSearchParams(next, { replace: true });
    };
    const found = activities.find((a) => a.id === activityParam);
    if (found) {
      setActiveActivity(found);
      clearParam();
      return;
    }
    fetchActivityById(activityParam)
      .then((a) => {
        if (cancelled) return;
        if (a) setActiveActivity(a);
        else toast.error("This activity is no longer available");
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't open the shared activity");
      })
      .finally(() => {
        if (!cancelled) clearParam();
      });
    return () => {
      cancelled = true;
    };
  }, [activityParam, activities, activitiesLoading, searchParams, setSearchParams]);

  // Keep the open detail sheet in sync after an edit (or any realtime update).
  useEffect(() => {
    setActiveActivity((prev) => {
      if (!prev) return prev;
      return activities.find((a) => a.id === prev.id) ?? prev;
    });
  }, [activities]);

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
    <div className="min-h-screen bg-background flex flex-col relative">
      <GlassBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <StickyHeader />
        <main
          className={`flex-1 max-w-md w-full mx-auto pb-32 ${isMap ? "px-4 pt-2" : "px-4 pt-2"}`}
        >
          <div key={activeTab} className="animate-fade-in">
            {content}
          </div>
        </main>
        <BottomNavigation active={activeTab} onChange={setActiveTab} />
      </div>
      <ActivityDetailSheet
        activity={activeActivity}
        onOpenChange={(open) => !open && setActiveActivity(null)}
      />
      <LocationPickerSheet />
    </div>
  );
};

export default Index;
