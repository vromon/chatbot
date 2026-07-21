"use server";

import type { UIMessage } from "ai";
import type { VisibilityType } from "@/components/chat/visibility-selector";

// Title generation — simple local implementation, no AI SDK needed
export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const text = message.parts
    ?.filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("") ?? "";

  // Take first 6 words as title
  const words = text.trim().split(/\s+/).slice(0, 6).join(" ");
  return words || "New Chat";
}

export async function deleteTrailingMessages(_params: { id: string }) {
  // Handled by FastAPI backend
}

export async function updateChatVisibility(_params: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // Handled by FastAPI backend
}
