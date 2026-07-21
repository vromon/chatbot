// All DB queries are handled by FastAPI backend.
// These are no-op stubs so the app compiles without a database.

import type { ArtifactKind } from "@/components/chat/artifact";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import type { Chat, DBMessage, Document, Suggestion, User, Vote } from "./schema";

export async function getUser(_email: string): Promise<User[]> {
  return [];
}

export async function createUser(_email: string, _password: string) {
  return [];
}

export async function createGuestUser() {
  return [{ id: "guest-" + Date.now(), email: "guest@local" }];
}

export async function saveChat(_params: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {}

export async function deleteChatById(_params: { id: string }): Promise<Chat | undefined> {
  return undefined;
}

export async function deleteAllChatsByUserId(_params: { userId: string }) {
  return { deletedCount: 0 };
}

export async function getChatsByUserId(_params: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  return { chats: [] as Chat[], hasMore: false };
}

export async function getChatById(_params: { id: string }): Promise<Chat | null> {
  return null;
}

export async function saveMessages(_params: { messages: DBMessage[] }) {}

export async function updateMessage(_params: { id: string; parts: unknown }) {}

export async function getMessagesByChatId(_params: { id: string }): Promise<DBMessage[]> {
  return [];
}

export async function voteMessage(_params: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {}

export async function getVotesByChatId(_params: { id: string }): Promise<Vote[]> {
  return [];
}

export async function saveDocument(_params: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}): Promise<Document[]> {
  return [];
}

export async function getDocumentsById(_params: { id: string }): Promise<Document[]> {
  return [];
}

export async function getDocumentById(_params: { id: string }): Promise<Document | undefined> {
  return undefined;
}

export async function deleteDocumentsByIdAfterTimestamp(_params: {
  id: string;
  timestamp: Date;
}): Promise<Document[]> {
  return [];
}

export async function saveSuggestions(_params: { suggestions: Suggestion[] }) {}

export async function getSuggestionsByDocumentId(_params: {
  documentId: string;
}): Promise<Suggestion[]> {
  return [];
}

export async function getMessageById(_params: { id: string }): Promise<DBMessage[]> {
  return [];
}

export async function deleteMessagesByChatIdAfterTimestamp(_params: {
  chatId: string;
  timestamp: Date;
}) {}

export async function updateChatVisibilityById(_params: {
  chatId: string;
  visibility: "private" | "public";
}) {}

export async function updateChatTitleById(_params: {
  chatId: string;
  title: string;
}) {}

export async function getMessageCountByUserId(_params: {
  id: string;
  differenceInHours: number;
}): Promise<number> {
  return 0;
}

export async function createStreamId(_params: {
  streamId: string;
  chatId: string;
}) {}

export async function getStreamIdsByChatId(_params: { chatId: string }): Promise<string[]> {
  return [];
}
