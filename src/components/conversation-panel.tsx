import type {
  ConversationMessage,
  DemoState,
  SessionUser,
} from "@/lib/demo-types";

type ConversationPanelProps = {
  messages: ConversationMessage[];
  state: DemoState;
  errorMessage: string | null;
  user: SessionUser | null;
};

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ConversationPanel({
  messages,
  state,
  errorMessage,
  user,
}: ConversationPanelProps) {
  return (
    <div className="rounded-[1.75rem] border border-[rgba(57,219,194,0.18)] bg-[linear-gradient(180deg,rgba(15,28,43,0.95),rgba(9,18,30,0.92))] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Conversation
          </p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {user?.isAuthenticated
              ? `Signed in as ${user.email ?? user.displayName ?? "Google user"}. Context is saved to your account.`
              : "Sign in to unlock saved account memory, follow-up context, and conversation history."}
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-[1.1rem] border border-[rgba(255,107,107,0.28)] bg-[rgba(74,20,26,0.55)] px-4 py-3 text-sm leading-6 text-white/84">
          {errorMessage}
        </div>
      ) : null}

      {!messages.length ? (
        <div className="mt-5 rounded-[1.35rem] border border-dashed border-white/12 bg-white/4 p-5 text-white/68">
          <p className="text-lg font-medium text-white">No conversation yet.</p>
          <p className="mt-2 text-sm leading-6 text-white/58">
            Send a message and the thread will stay here so follow-up questions
            keep their context.
          </p>
        </div>
      ) : (
        <div className="mt-5 max-h-[34rem] space-y-4 overflow-y-auto pr-1">
          {messages.map((message) => {
            const isAssistant = message.role === "assistant";

            return (
              <div
                key={message.id}
                className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[92%] rounded-[1.35rem] px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ${
                    isAssistant
                      ? "border border-[rgba(57,219,194,0.14)] bg-[rgba(17,32,49,0.92)]"
                      : "border border-[rgba(57,219,194,0.24)] bg-[linear-gradient(135deg,rgba(57,219,194,0.18),rgba(12,112,103,0.2))]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                      {isAssistant ? "Rovik" : "You"}
                    </span>
                    <span className="text-[11px] text-white/38">
                      {formatTimestamp(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/86">
                    {message.content}
                  </p>
                </div>
              </div>
            );
          })}

          {state === "processing" ? (
            <div className="flex justify-start">
              <div className="rounded-[1.35rem] border border-[rgba(57,219,194,0.14)] bg-[rgba(17,32,49,0.92)] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/46">
                  Rovik
                </span>
                <div className="mt-3 flex gap-2">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="h-2.5 w-2.5 rounded-full bg-[rgba(177,245,232,0.9)] animate-pulse"
                      style={{ animationDelay: `${index * 140}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
