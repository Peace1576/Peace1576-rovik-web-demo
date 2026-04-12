"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  defaultPersonality,
  demoPrompts,
  DEMO_BROWSER_HINT,
  personalityOptions,
  rovikCopy,
} from "@/lib/demo-content";
import type {
  AskRovikResponse,
  DemoMode,
  DemoState,
  ExamplePrompt,
  RovikPersonality,
  RovikExpression,
} from "@/lib/demo-types";
import { ExamplePrompts } from "@/components/example-prompts";
import { MicButton } from "@/components/mic-button";
import { PersonalitySelector } from "@/components/personality-selector";
import { ResponseCard } from "@/components/response-card";
import { RovikFace } from "@/components/rovik-face";
import { TranscriptBox } from "@/components/transcript-box";

const inactivityMs = 2600;

function inferMode(transcript: string): DemoMode {
  const value = transcript.toLowerCase();

  if (
    value.includes("email") ||
    value.includes("reply") ||
    value.includes("inbox") ||
    value.includes("draft")
  ) {
    return "email";
  }

  if (
    value.includes("plan") ||
    value.includes("schedule") ||
    value.includes("tomorrow") ||
    value.includes("day")
  ) {
    return "planning";
  }

  if (
    value.includes("research") ||
    value.includes("compare") ||
    value.includes("best") ||
    value.includes("topic")
  ) {
    return "research";
  }

  return "general";
}

function joinTranscript(base: string, addition: string) {
  const basePart = base.trim();
  const additionPart = addition.trim();

  if (!basePart) {
    return additionPart;
  }

  if (!additionPart) {
    return basePart;
  }

  return `${basePart} ${additionPart}`.trim();
}

function getExpressionState({
  demoState,
  transcript,
  response,
  errorMessage,
}: {
  demoState: DemoState;
  transcript: string;
  response: AskRovikResponse | null;
  errorMessage: string | null;
}): RovikExpression {
  if (errorMessage || demoState === "error") {
    return "error";
  }

  if (demoState === "unsupported") {
    return "confused";
  }

  if (demoState === "listening") {
    return "listening";
  }

  if (demoState === "processing") {
    return "thinking";
  }

  if (response && demoState === "ready") {
    if (/need more information|please provide|please clarify|let me know more/i.test(response.summary)) {
      return "confused";
    }

    if (response.mode === "general" && transcript.trim().split(/\s+/).length <= 3) {
      return "speaking";
    }

    return "success";
  }

  return "idle";
}

export function DemoShell() {
  const [speechSupported, setSpeechSupported] = useState(true);
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [transcript, setTranscript] = useState("");
  const [mode, setMode] = useState<DemoMode>("planning");
  const [personality, setPersonality] =
    useState<RovikPersonality>(defaultPersonality);
  const [source, setSource] = useState<"voice" | "typed">("typed");
  const [response, setResponse] = useState<AskRovikResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptBaseRef = useRef("");
  const expression = getExpressionState({
    demoState,
    transcript,
    response,
    errorMessage,
  });

  useEffect(() => {
    const supported = Boolean(
      typeof window !== "undefined" &&
        (window.SpeechRecognition || window.webkitSpeechRecognition),
    );

    setSpeechSupported(supported);

    if (!supported) {
      setDemoState("unsupported");
    }
  }, []);

  function clearInactivityTimer() {
    if (!inactivityTimerRef.current) {
      return;
    }

    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = null;
  }

  function stopRecognition() {
    clearInactivityTimer();
    recognitionRef.current?.stop();
  }

  function resetInactivityTimer() {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, inactivityMs);
  }

  useEffect(() => {
    return () => {
      clearInactivityTimer();
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  async function startListening() {
    const RecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setSpeechSupported(false);
      setDemoState("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setDemoState("error");
      setErrorMessage(
        "Microphone access was blocked. You can still type a prompt manually.",
      );
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    transcriptBaseRef.current = transcript.trim();
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const chunk = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += `${chunk} `;
        } else {
          interimTranscript += chunk;
        }
      }

      const combined = joinTranscript(
        transcriptBaseRef.current,
        `${finalTranscript} ${interimTranscript}`.trim(),
      );

      setTranscript(combined);
      setMode(inferMode(combined));
      setSource("voice");
      resetInactivityTimer();
    };

    recognition.onerror = (event) => {
      clearInactivityTimer();
      setDemoState("error");
      setErrorMessage(
        event.error === "not-allowed"
          ? "Microphone permission was denied. Type a prompt instead or re-enable the mic permission."
          : "Voice transcription failed. Try again or type the request manually.",
      );
    };

    recognition.onend = () => {
      clearInactivityTimer();
      recognitionRef.current = null;

      setDemoState((current) => {
        if (current === "processing") {
          return current;
        }

        if (!speechSupported) {
          return "unsupported";
        }

        return response ? "ready" : "idle";
      });
    };

    setErrorMessage(null);
    setDemoState("listening");
    setSource("voice");
    recognition.start();
    resetInactivityTimer();
  }

  async function handleMicClick() {
    if (!speechSupported) {
      setDemoState("unsupported");
      return;
    }

    if (demoState === "listening") {
      stopRecognition();
      return;
    }

    await startListening();
  }

  async function handleSubmit() {
    const trimmed = transcript.trim();

    if (!trimmed) {
      return;
    }

    if (demoState === "listening") {
      stopRecognition();
    }

    setErrorMessage(null);
    setDemoState("processing");

    try {
      const requestMode = mode === "general" ? inferMode(trimmed) : mode;
      const apiResponse = await fetch("/api/ask-rovik", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: trimmed,
          mode: requestMode,
          personality,
          source,
        }),
      });

      const payload = (await apiResponse.json()) as
        | AskRovikResponse
        | { error?: string };

      if (!apiResponse.ok || !("summary" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "The request failed.",
        );
      }

      startTransition(() => {
        setResponse(payload);
      });
      setMode(payload.mode);
      setDemoState("ready");
    } catch (error) {
      setDemoState(speechSupported ? "error" : "unsupported");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The request failed before Rovik could respond.",
      );
    }
  }

  function handlePromptSelect(prompt: ExamplePrompt) {
    setTranscript(prompt.prompt);
    setMode(prompt.mode);
    setSource("typed");
    setErrorMessage(null);

    if (demoState === "unsupported") {
      return;
    }

    setDemoState(response ? "ready" : "idle");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,27,0.92),rgba(5,12,22,0.96))] p-6 shadow-[0_28px_80px_rgba(2,8,17,0.34)] md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">
              Interactive demo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
              {rovikCopy.demoTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
              {rovikCopy.demoDescription}
            </p>
          </div>

          <div className="rounded-full border border-[rgba(57,219,194,0.18)] bg-[rgba(57,219,194,0.09)] px-4 py-2 text-sm font-medium text-[rgba(177,245,232,0.92)]">
            {statusLabel(demoState)}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-4">
            <RovikFace expression={expression} />
            <MicButton
              state={demoState}
              disabled={demoState === "processing" || !speechSupported}
              onClick={handleMicClick}
            />
            <p className="max-w-32 text-center text-sm leading-6 text-white/52">
              {speechSupported
                ? "Click once to start listening. Click again to stop."
                : "Voice input is unavailable in this browser."}
            </p>
          </div>

          <TranscriptBox
            value={transcript}
            onChange={(event) => {
              const nextValue = event.target.value;
              setTranscript(nextValue);
              setMode(inferMode(nextValue));
              setSource("typed");
              setErrorMessage(null);
            }}
            state={demoState}
            mode={mode}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm leading-6 text-white/48">
            {DEMO_BROWSER_HINT}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!transcript.trim() || demoState === "processing"}
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#39dbc2_0%,#0f8a7b_100%)] px-5 py-3 text-sm font-semibold text-[#02121c] transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {demoState === "processing" ? "Processing..." : "Send to Rovik"}
          </button>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                Rovik personality
              </p>
              <p className="mt-2 text-sm text-white/45">
                Switch tone any time before sending the request.
              </p>
            </div>
          </div>
          <PersonalitySelector
            options={personalityOptions}
            selected={personality}
            onSelect={setPersonality}
          />
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">
              Example prompts
            </p>
            <p className="text-sm text-white/45">
              Clicking a prompt fills the transcript without auto-submitting.
            </p>
          </div>
          <ExamplePrompts prompts={demoPrompts} onSelect={handlePromptSelect} />
        </div>
      </section>

      <section className="grid gap-6">
        <ResponseCard
          response={response}
          state={demoState}
          errorMessage={errorMessage}
        />

        <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">
            Demo flow
          </p>
          <div className="mt-4 grid gap-3">
            {[
              "Open the demo page.",
              "Speak or type a command.",
              "Review the transcript.",
              "Send the request to Gemini.",
              "Read the structured Rovik response.",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3"
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(57,219,194,0.14)] text-xs font-semibold text-[rgba(177,245,232,0.92)]">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-white/72">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function statusLabel(state: DemoState) {
  if (state === "listening") {
    return "Listening...";
  }

  if (state === "processing") {
    return "Processing...";
  }

  if (state === "ready") {
    return "Response ready";
  }

  if (state === "unsupported") {
    return "Manual text only";
  }

  if (state === "error") {
    return "Needs attention";
  }

  return "Ready";
}
