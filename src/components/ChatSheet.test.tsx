import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeActivity } from "@/test/fixtures";

const sendMessage = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "me" },
    profile: { display_name: "Donia", avatar_url: null },
  }),
}));
vi.mock("@/lib/chatApi", () => ({
  fetchMessages: vi.fn().mockResolvedValue([]),
  fetchAuthor: vi.fn(),
  sendMessage: (...args: unknown[]) => sendMessage(...args),
}));
vi.mock("@/integrations/supabase/client", () => {
  const channel = { on: () => channel, subscribe: () => channel };
  return { supabase: { channel: () => channel, removeChannel: () => {} } };
});

import { ChatSheet } from "@/components/ChatSheet";

const setup = async () => {
  render(<ChatSheet activity={makeActivity({ id: "a1" })} onOpenChange={() => {}} />);
  await act(async () => {}); // let the (empty) history load
  return screen.getByPlaceholderText("Message your tribe…") as HTMLTextAreaElement;
};

describe("ChatSheet composer", () => {
  beforeEach(() => {
    sendMessage.mockReset().mockImplementation(async (activityId, userId, body) => ({
      id: `s-${body}`,
      activity_id: activityId,
      user_id: userId,
      body,
      created_at: new Date().toISOString(),
    }));
  });

  it("clears the field and shows the message immediately (QA-034)", async () => {
    const input = await setup();
    fireEvent.change(input, { target: { value: "On my way" } });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    expect(input.value).toBe("");
    expect(screen.getByText("On my way")).toBeInTheDocument();
    await act(async () => {});
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it("a quick double Enter sends only once (QA-035)", async () => {
    const input = await setup();
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    await act(async () => {});
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it("Enter while the keyboard is composing a word doesn't send (QA-035)", async () => {
    const input = await setup();
    fireEvent.change(input, { target: { value: "Hal" } });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13, isComposing: true });
    await act(async () => {});
    expect(sendMessage).not.toHaveBeenCalled();
    expect(input.value).toBe("Hal");
  });
});
