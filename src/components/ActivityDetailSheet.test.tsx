import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeActivity } from "@/test/fixtures";

const auth = { user: null as null | { id: string } };
const rsvps = { joinedIds: new Set<string>() };

vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("@/hooks/useUserRSVPs", () => ({
  useUserRSVPs: () => ({ joinedIds: rsvps.joinedIds, refresh: vi.fn() }),
}));
vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({ favoriteIds: new Set<string>(), toggle: vi.fn() }),
}));
vi.mock("@/lib/activitiesApi", () => ({
  fetchParticipants: vi.fn().mockResolvedValue([]),
  joinActivity: vi.fn(),
  leaveActivity: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => {
  const channel = { on: () => channel, subscribe: () => channel };
  return { supabase: { channel: () => channel, removeChannel: () => {} } };
});
vi.mock("@/components/EditActivitySheet", () => ({ EditActivitySheet: () => null }));
vi.mock("@/components/ChatSheet", () => ({
  ChatSheet: ({ activity }: { activity: { title: string } | null }) =>
    activity ? <div data-testid="chat-sheet">{activity.title}</div> : null,
}));

import { ActivityDetailSheet } from "@/components/ActivityDetailSheet";

const activity = makeActivity({ id: "a1", title: "Sunset 5K", host: { ...makeActivity().host, id: "host" } });

const renderSheet = () =>
  render(
    <MemoryRouter>
      <ActivityDetailSheet activity={activity} onOpenChange={() => {}} />
    </MemoryRouter>,
  );

describe("ActivityDetailSheet chat button (FR-001)", () => {
  beforeEach(() => {
    auth.user = null;
    rsvps.joinedIds = new Set();
  });

  it("is hidden for visitors and for signed-in non-members", () => {
    renderSheet();
    expect(screen.queryByRole("button", { name: /chat/i })).toBeNull();

    auth.user = { id: "someone" };
    renderSheet();
    expect(screen.queryByRole("button", { name: /chat/i })).toBeNull();
  });

  it("opens the activity chat for participants who are going", () => {
    auth.user = { id: "member" };
    rsvps.joinedIds = new Set(["a1"]);
    renderSheet();
    fireEvent.click(screen.getByRole("button", { name: /chat/i }));
    expect(screen.getByTestId("chat-sheet")).toHaveTextContent("Sunset 5K");
  });

  it("is shown to the host", () => {
    auth.user = { id: "host" };
    renderSheet();
    expect(screen.getByRole("button", { name: /chat/i })).toBeInTheDocument();
  });
});
