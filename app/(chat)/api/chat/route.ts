import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { chatModels, DEFAULT_CHAT_MODEL, allowedModelIds } from "@/lib/ai/models";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

// ── FastAPI response types ────────────────────────────────────────────────────
interface Activity {
  title: string;
  description: string;
}
interface DayPlan {
  day: number;
  theme: string;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
}
interface TripItinerary {
  destination: string;
  total_days: number;
  overview: string;
  days: DayPlan[];
}

const FASTAPI_BASE_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

function formatTripItinerary(trip: TripItinerary): string {
  let text = `## ${trip.destination} — ${trip.total_days} Day Itinerary\n\n`;
  text += `${trip.overview}\n\n`;
  for (const day of trip.days) {
    text += `### Day ${day.day}: ${day.theme}\n\n`;
    text += "**Morning**\n";
    for (const a of day.morning) text += `- **${a.title}**: ${a.description}\n`;
    text += "\n**Afternoon**\n";
    for (const a of day.afternoon) text += `- **${a.title}**: ${a.description}\n`;
    text += "\n**Evening**\n";
    for (const a of day.evening) text += `- **${a.title}**: ${a.description}\n`;
    text += "\n";
  }
  return text;
}

// ── Resumable stream helper ───────────────────────────────────────────────────
function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch {
    return null;
  }
}

export { getStreamContext };

// ── POST /api/chat ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const chatModel = allowedModelIds.has(selectedChatModel)
      ? selectedChatModel
      : DEFAULT_CHAT_MODEL;

    const isToolApprovalFlow = Boolean(messages);

    // ── Load or create the chat record (no-op stubs, FastAPI handles persistence) ──
    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      messagesFromDb = await getMessagesByChatId({ id });
    } else if (message?.role === "user") {
      await saveChat({
        id,
        title: "New chat",
        userId: "local-user",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    // ── Build uiMessages ────────────────────────────────────────────────────
    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    // Save the incoming user message (no-op stub)
    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            attachments: [],
            chatId: id,
            createdAt: new Date(),
            id: message.id,
            parts: message.parts,
            role: "user",
          },
        ],
      });
    }

    const modelConfig = chatModels.find((m) => m.id === chatModel);

    // Extract the latest user message text to forward to FastAPI
    const userText =
      uiMessages
        .at(-1)
        ?.parts?.filter((p) => p.type === "text")
        .map((p) => (p as { type: "text"; text: string }).text)
        .join("") ?? "";

    // ── Build the UI message stream ─────────────────────────────────────────
    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        // 1. Show "waiting" status in the UI
        dataStream.write({
          type: "data-waiting-status",
          transient: true,
          data: {
            phase: "waiting",
            message: "Generating your trip plan...",
            modelId: chatModel,
            modelName: modelConfig?.name ?? chatModel,
          },
        });

        // 2. Call FastAPI backend
        let tripText: string;
        try {
          const fastApiRes = await fetch(`${FASTAPI_BASE_URL}/trip/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_query: userText }),
          });

          if (!fastApiRes.ok) {
            const errBody = await fastApiRes.text();
            throw new Error(`FastAPI ${fastApiRes.status}: ${errBody}`);
          }

          const tripData = (await fastApiRes.json()) as TripItinerary;
          tripText = formatTripItinerary(tripData);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Unknown error from FastAPI";
          tripText = `Sorry, I couldn't generate a trip plan right now.\n\n_${msg}_`;
        }

        // 3. Switch status to "thinking"
        dataStream.write({
          type: "data-waiting-status",
          transient: true,
          data: {
            phase: "thinking",
            message: "Thinking...",
            modelId: chatModel,
            modelName: modelConfig?.name ?? chatModel,
          },
        });

        // 4. Write the response text using the correct AI SDK v7 protocol
        const textId = generateUUID();
        dataStream.write({ type: "start", messageId: generateUUID() });
        dataStream.write({ type: "start-step" });
        dataStream.write({ type: "text-start", id: textId });
        dataStream.write({ type: "text-delta", id: textId, delta: tripText });
        dataStream.write({ type: "text-end", id: textId });
        dataStream.write({ type: "finish-step" });
        dataStream.write({ type: "finish", finishReason: "stop" });

        // 5. Update chat title
        if (titlePromise) {
          try {
            const title = await titlePromise;
            dataStream.write({ type: "data-chat-title", data: title });
            updateChatTitleById({ chatId: id, title });
          } catch {
            /* non-fatal */
          }
        }
      },
      generateId: generateUUID,
      onEnd: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          await Promise.all(
            finishedMessages.map(async (finishedMsg) => {
              const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
              if (existingMsg) {
                await updateMessage({ id: finishedMsg.id, parts: finishedMsg.parts });
                return;
              }
              await saveMessages({
                messages: [
                  {
                    attachments: [],
                    chatId: id,
                    createdAt: new Date(),
                    id: finishedMsg.id,
                    parts: finishedMsg.parts,
                    role: finishedMsg.role,
                  },
                ],
              });
            })
          );
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((m) => ({
              attachments: [],
              chatId: id,
              createdAt: new Date(),
              id: m.id,
              parts: m.parts,
              role: m.role,
            })),
          });
        }
      },
      onError: () => "Oops, an error occurred!",
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    });

    return createUIMessageStreamResponse({
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) return;
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ chatId: id, streamId });
            await streamContext.createNewResumableStream(streamId, () => sseStream);
          }
        } catch {
          /* non-critical */
        }
      },
      stream,
    });
  } catch (error) {
    if (error instanceof ChatbotError) return error.toResponse();
    console.error("Unhandled error in chat API:", error);
    return new ChatbotError("offline:chat").toResponse();
  }
}

// ── DELETE /api/chat ──────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return new ChatbotError("bad_request:api").toResponse();

  const deletedChat = await deleteChatById({ id });
  return Response.json(deletedChat, { status: 200 });
}
