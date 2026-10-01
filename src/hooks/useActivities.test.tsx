import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeActivity } from "@/test/fixtures";

const fetchActivitiesWithHosts = vi.fn();

vi.mock("@/lib/activitiesApi", () => ({
  fetchActivitiesWithHosts: () => fetchActivitiesWithHosts(),
}));

vi.mock("@/integrations/supabase/client", () => {
  const channel = { on: () => channel, subscribe: () => channel };
  return { supabase: { channel: () => channel, removeChannel: () => {} } };
});

import { useActivities } from "@/hooks/useActivities";

describe("useActivities", () => {
  beforeEach(() => fetchActivitiesWithHosts.mockReset());

  it("exposes load errors instead of an empty feed, and recovers on retry (QA-003)", async () => {
    fetchActivitiesWithHosts.mockRejectedValueOnce({ message: "Failed to fetch" });
    const { result } = renderHook(() => useActivities());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to fetch");
    expect(result.current.activities).toEqual([]);

    fetchActivitiesWithHosts.mockResolvedValueOnce([makeActivity()]);
    await act(() => result.current.retry());

    expect(result.current.error).toBeNull();
    expect(result.current.activities).toHaveLength(1);
  });
});
