import { Compass, Map as MapIcon, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabKey } from "@/lib/tabs";

type Item = {
  key: TabKey;
  label: string;
  Icon: typeof Compass;
};

const ITEMS: [Item, Item, Item, Item] = [
  { key: "discover", label: "Discover", Icon: Compass },
  { key: "map", label: "Map", Icon: MapIcon },
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "you", label: "You", Icon: User },
];

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

export const BottomNavigation = ({ active, onChange }: Props) => {
  const [discover, map, chat, you] = ITEMS;

  const renderTab = (item: Item) => {
    const isActive = active === item.key;
    const Icon = item.Icon;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => onChange(item.key)}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className="group flex flex-col items-center gap-1 py-1 transition-colors"
      >
        <Icon
          className={cn(
            "size-6 transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground",
          )}
          aria-hidden
          strokeWidth={isActive ? 2.4 : 2}
        />
        <span
          className={cn(
            "text-[10px] font-medium transition-colors",
            isActive ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {item.label}
        </span>
        <span
          className={cn(
            "h-1 w-1 rounded-full transition-all",
            isActive ? "bg-primary" : "bg-transparent",
          )}
          aria-hidden
        />
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto rounded-full glass-strong shadow-float mb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5 items-end px-3 pt-2 pb-2 relative">
        {renderTab(discover)}
        {renderTab(map)}

        {/* Center: elevated Create circle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onChange("create")}
            aria-label="Create activity"
            aria-current={active === "create" ? "page" : undefined}
            className={cn(
              "-translate-y-5 grid place-items-center w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow ring-4 ring-background",
              "transition-transform duration-300 ease-bounce hover:scale-105 active:scale-95",
              active === "create" && "ring-primary/30",
            )}
          >
            <Plus className="size-7" strokeWidth={2.6} aria-hidden />
          </button>
        </div>

        {renderTab(chat)}
        {renderTab(you)}
      </div>
    </nav>
  );
};
