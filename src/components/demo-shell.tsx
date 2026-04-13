"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import {
  defaultPersonality,
  demoPrompts,
  DEMO_BROWSER_HINT,
  personalityOptions,
  rovikCopy,
} from "@/lib/demo-content";
import type {
  AskRovikResponse,
  ConversationMessage,
  ConversationSessionResponse,
  DemoMode,
  DemoState,
  ExamplePrompt,
  RovikExpression,
  RovikPersonality,
  SessionUser,
} from "@/lib/demo-types";
import { ConversationPanel } from "@/components/conversation-panel";
import { ExamplePrompts } from "@/components/example-prompts";
import { MicButton } from "@/components/mic-button";
import { PersonalitySelector } from "@/components/personality-selector";
import { RovikFace } from "@/components/rovik-face";
import { TranscriptBox } from "@/components/transcript-box";

type WakeState = "off" | "arming" | "standby" | "detected";
type SpeechProfile = {
  wakeSupported: boolean;
  commandContinuous: boolean;
  wakeCompatibilityMessage: string | null;
};

const inactivityMs = 2600;
const wakeRestartMs = 700;
const wakeAlertMs = 260;
const idleFinalizeMs = 90_000;

function getSpeechProfile() {
  if (typeof navigator === "undefined") {
    return {
      wakeSupported: true,
      commandContinuous: true,
      wakeCompatibilityMessage: null,
    } satisfies SpeechProfile;
  }

  const userAgent = navigator.userAgent ?? "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
  const isWebKitOnly =
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|Chromium|Edg|EdgiOS|FxiOS|OPR|Opera/i.test(userAgent);

  if (isIOS || (isMobile && isWebKitOnly)) {
    return {
      wakeSupported: true,
      commandContinuous: false,
      wakeCompatibilityMessage:
        "Wake mode is experimental on this browser. If it misses the wake word, use the mic button for one command at a time.",
    } satisfies SpeechProfile;
  }

  return {
    wakeSupported: true,
    commandContinuous: true,
    wakeCompatibilityMessage: null,
  } satisfies SpeechProfile;
}

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

function containsWakeWord(value: string) {
  return /\b(?:(?:hey|ok(?:ay)?)\s+)?rovik\b/i.test(value);
}

function stripWakeWord(value: string) {
  return value
    .replace(/\b(?:(?:hey|ok(?:ay)?)\s+)?rovik\b[\s,:;.!?-]*/i, "")
    .trim();
}

function getExpressionState({
  demoState,
  wakeState,
  messages,
  errorMessage,
}: {
  demoState: DemoState;
  wakeState: WakeState;
  messages: ConversationMessage[];
  errorMessage: string | null;
}): RovikExpression {
  if (errorMessage || demoState === "error") {
    return "error";
  }

  if (demoState === "unsupported") {
    return "confused";
  }

  if (wakeState === "detected") {
    return "alert";
  }

  if (demoState === "listening") {
    return "listening";
  }

  if (demoState === "processing") {
    return "thinking";
  }

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (lastAssistantMessage && demoState === "ready") {
    if (
      /need more information|please provide|please clarify|let me know more/i.test(
        lastAssistantMessage.content,
      )
    ) {
      return "confused";
    }

    if (
      lastUserMessage &&
      lastUserMessage.content.trim().split(/\s+/).length <= 3
    ) {
      return "speaking";
    }

    return "success";
  }

  return "idle";
}

export function DemoShell() {
  const [speechSupported, setSpeechSupported] = useState(true);
  const [wakeSupported, setWakeSupported] = useState(true);
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [wakeState, setWakeState] = useState<WakeState>("off");
  const [wakeModeEnabled, setWakeModeEnabled] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [mode, setMode] = useState<DemoMode>("planning");
  const [personality, setPersonality] =
    useState<RovikPersonality>(defaultPersonality);
  const [source, setSource] = useState<"voice" | "typed">("typed");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const commandRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wakeRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptBaseRef = useRef("");
  const messagesRef = useRef<ConversationMessage[]>([]);
  const speechSupportedRef = useRef(true);
  const wakeSupportedRef = useRef(true);
  const demoStateRef = useRef<DemoState>("idle");
  const wakeModeEnabledRef = useRef(false);
  const speechProfileRef = useRef<SpeechProfile>({
    wakeSupported: true,
    commandContinuous: true,
    wakeCompatibilityMessage: null,
  });
  const wakeIgnoreEndRef = useRef(false);
  const wakeTriggeredRef = useRef(false);
  const wakeSeedTranscriptRef = useRef("");
  const commandLaunchPendingRef = useRef(false);

  const expression = getExpressionState({
    demoState,
    wakeState,
    messages,
    errorMessage,
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    speechSupportedRef.current = speechSupported;
  }, [speechSupported]);

  useEffect(() => {
    wakeSupportedRef.current = wakeSupported;
  }, [wakeSupported]);

  useEffect(() => {
    demoStateRef.current = demoState;
  }, [demoState]);

  useEffect(() => {
    wakeModeEnabledRef.current = wakeModeEnabled;
  }, [wakeModeEnabled]);

  useEffect(() => {
    const profile = getSpeechProfile();
    speechProfileRef.current = profile;
    wakeSupportedRef.current = profile.wakeSupported;
    setWakeSupported(profile.wakeSupported);

    const supported = Boolean(
      typeof window !== "undefined" &&
        (window.SpeechRecognition || window.webkitSpeechRecognition),
    );

    setSpeechSupported(supported);
    speechSupportedRef.current = supported;

    if (!supported) {
      demoStateRef.current = "unsupported";
      setDemoState("unsupported");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const authError = new URLSearchParams(window.location.search).get("authError");

    if (authError) {
      setErrorMessage(authError);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    if (finalizeTimerRef.current) {
      clearTimeout(finalizeTimerRef.current);
    }

    if (
      sessionLoading ||
      !conversationId ||
      !messages.length ||
      demoState === "processing"
    ) {
      return;
    }

    finalizeTimerRef.current = setTimeout(() => {
      void fetch("/api/conversation/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
        }),
      }).catch(() => {
        // Idle finalization is best-effort.
      });
    }, idleFinalizeMs);

    return () => {
      if (finalizeTimerRef.current) {
        clearTimeout(finalizeTimerRef.current);
      }
    };
  }, [conversationId, demoState, messages, sessionLoading]);

  function setDemoStateValue(next: DemoState) {
    demoStateRef.current = next;
    setDemoState(next);
  }

  async function loadSession(reset = false) {
    setSessionLoading(true);

    try {
      const response = await fetch(
        `/api/conversation/session${reset ? "?reset=1" : ""}`,
        {
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as ConversationSessionResponse;

      if (!response.ok) {
        throw new Error("Could not load the conversation session.");
      }

      setConversationId(payload.conversationId);
      setMessages(payload.messages ?? []);
      setUser(payload.user);

      if (reset) {
        setTranscript("");
        setMode("planning");
        setSource("typed");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load the conversation session.",
      );
    } finally {
      setSessionLoading(false);
    }
  }

  function clearInactivityTimer() {
    if (!inactivityTimerRef.current) {
      return;
    }

    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = null;
  }

  function clearWakeRestartTimer() {
    if (!wakeRestartTimerRef.current) {
      return;
    }

    clearTimeout(wakeRestartTimerRef.current);
    wakeRestartTimerRef.current = null;
  }

  function getRecognitionConstructor() {
    if (typeof window === "undefined") {
      return null;
    }

    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  async function ensureMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  function stopCommandRecognition({ abort = false }: { abort?: boolean } = {}) {
    clearInactivityTimer();

    if (!commandRecognitionRef.current) {
      return;
    }

    if (abort) {
      commandRecognitionRef.current.abort();
      return;
    }

    commandRecognitionRef.current.stop();
  }

  function stopWakeRecognition({
    abort = false,
    ignoreEnd = false,
  }: {
    abort?: boolean;
    ignoreEnd?: boolean;
  } = {}) {
    clearWakeRestartTimer();
    wakeIgnoreEndRef.current = ignoreEnd;

    if (!wakeRecognitionRef.current) {
      return;
    }

    if (abort) {
      wakeRecognitionRef.current.abort();
      return;
    }

    wakeRecognitionRef.current.stop();
  }

  async function startWakeListening({
    skipPermissionCheck = false,
  }: {
    skipPermissionCheck?: boolean;
  } = {}) {
    const RecognitionCtor = getRecognitionConstructor();

    if (!RecognitionCtor) {
      setSpeechSupported(false);
      speechSupportedRef.current = false;
      setDemoStateValue("unsupported");
      setWakeState("off");
      return;
    }

    if (
      !wakeModeEnabledRef.current ||
      !wakeSupportedRef.current ||
      wakeRecognitionRef.current ||
      commandRecognitionRef.current ||
      commandLaunchPendingRef.current ||
      demoStateRef.current === "processing"
    ) {
      return;
    }

    if (!skipPermissionCheck) {
      const hasAccess = await ensureMicrophoneAccess();

      if (!hasAccess) {
        wakeModeEnabledRef.current = false;
        setWakeModeEnabled(false);
        setWakeState("off");
        setDemoStateValue("error");
        setErrorMessage(
          "Microphone access was blocked. Wake mode could not start.",
        );
        return;
      }
    }

    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = speechProfileRef.current.commandContinuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    wakeRecognitionRef.current = recognition;
    setWakeState("standby");
    setErrorMessage(null);

    recognition.onresult = (event) => {
      let heard = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const chunk = event.results[index][0]?.transcript ?? "";
        heard += ` ${chunk}`;
      }

      const transcriptChunk = heard.trim();

      if (!transcriptChunk || !containsWakeWord(transcriptChunk)) {
        return;
      }

      wakeTriggeredRef.current = true;
      wakeSeedTranscriptRef.current = stripWakeWord(transcriptChunk);
      setWakeState("detected");
      setErrorMessage(null);
      stopWakeRecognition();
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        return;
      }

      if (event.error === "not-allowed") {
        wakeModeEnabledRef.current = false;
        setWakeModeEnabled(false);
        setWakeState("off");
        setDemoStateValue(messagesRef.current.length ? "ready" : "idle");
        setErrorMessage(null);
        return;
      }

      if (
        event.error === "service-not-allowed" ||
        event.error === "audio-capture" ||
        event.error === "network" ||
        event.error === "language-not-supported"
      ) {
        wakeModeEnabledRef.current = false;
        setWakeModeEnabled(false);
        setWakeState("off");
        setDemoStateValue(messagesRef.current.length ? "ready" : "idle");
        setErrorMessage(null);
        return;
      }

      setWakeState("off");
      setDemoStateValue(messagesRef.current.length ? "ready" : "idle");
      setErrorMessage(null);
    };

    recognition.onend = () => {
      wakeRecognitionRef.current = null;
      clearWakeRestartTimer();

      if (wakeTriggeredRef.current) {
        const seedTranscript = wakeSeedTranscriptRef.current;
        wakeTriggeredRef.current = false;
        wakeSeedTranscriptRef.current = "";

        window.setTimeout(() => {
          void startCommandListening({
            resetTranscript: true,
            seedTranscript,
          });
        }, wakeAlertMs);

        return;
      }

      if (wakeIgnoreEndRef.current) {
        wakeIgnoreEndRef.current = false;

        if (!wakeModeEnabledRef.current) {
          setWakeState("off");
          return;
        }

        if (
          commandLaunchPendingRef.current ||
          commandRecognitionRef.current ||
          demoStateRef.current === "processing"
        ) {
          return;
        }

        wakeRestartTimerRef.current = setTimeout(() => {
          void startWakeListening({ skipPermissionCheck: true });
        }, wakeRestartMs);
        return;
      }

      if (!wakeModeEnabledRef.current) {
        setWakeState("off");
        return;
      }

      if (
        commandLaunchPendingRef.current ||
        commandRecognitionRef.current ||
        demoStateRef.current === "processing"
      ) {
        return;
      }

      wakeRestartTimerRef.current = setTimeout(() => {
        void startWakeListening({ skipPermissionCheck: true });
      }, wakeRestartMs);
    };

    try {
      recognition.start();
    } catch {
      wakeRecognitionRef.current = null;
      wakeModeEnabledRef.current = false;
      setWakeModeEnabled(false);
      setWakeState("off");
      setDemoStateValue(messagesRef.current.length ? "ready" : "idle");
      setErrorMessage(null);
    }
  }

  function resetInactivityTimer() {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      stopCommandRecognition();
    }, inactivityMs);
  }

  async function startCommandListening({
    resetTranscript = false,
    seedTranscript = "",
  }: {
    resetTranscript?: boolean;
    seedTranscript?: string;
  } = {}) {
    const RecognitionCtor = getRecognitionConstructor();

    if (!RecognitionCtor) {
      setSpeechSupported(false);
      speechSupportedRef.current = false;
      setDemoStateValue("unsupported");
      return;
    }

    if (commandRecognitionRef.current || commandLaunchPendingRef.current) {
      return;
    }

    commandLaunchPendingRef.current = true;
    stopWakeRecognition({ ignoreEnd: true });

    const hasAccess = await ensureMicrophoneAccess();

    if (!hasAccess) {
      commandLaunchPendingRef.current = false;
      setDemoStateValue("error");
      setErrorMessage(
        "Microphone access was blocked. You can still type a prompt manually.",
      );

      if (wakeModeEnabledRef.current) {
        wakeRestartTimerRef.current = setTimeout(() => {
          void startWakeListening({ skipPermissionCheck: true });
        }, wakeRestartMs);
      }

      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = speechProfileRef.current.commandContinuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const baseTranscript = resetTranscript
      ? seedTranscript.trim()
      : joinTranscript(transcript, seedTranscript);

    transcriptBaseRef.current = baseTranscript;
    commandRecognitionRef.current = recognition;

    if (resetTranscript || seedTranscript) {
      setTranscript(baseTranscript);
      setMode(inferMode(baseTranscript));
    }

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
      if (event.error === "aborted") {
        return;
      }

      if (event.error === "no-speech") {
        clearInactivityTimer();
        commandRecognitionRef.current = null;
        commandLaunchPendingRef.current = false;
        setDemoStateValue(messagesRef.current.length ? "ready" : "idle");
        setErrorMessage(null);

        if (wakeModeEnabledRef.current && wakeSupportedRef.current) {
          wakeRestartTimerRef.current = setTimeout(() => {
            void startWakeListening({ skipPermissionCheck: true });
          }, wakeRestartMs);
        }
        return;
      }

      if (event.error === "not-allowed") {
        clearInactivityTimer();
        commandRecognitionRef.current = null;
        commandLaunchPendingRef.current = false;
        setDemoStateValue("unsupported");
        setErrorMessage(
          "Speech recognition is not available in this browser session right now. Use typed input or try Chrome or Edge.",
        );
        return;
      }

      if (
        event.error === "service-not-allowed" ||
        event.error === "audio-capture" ||
        event.error === "language-not-supported"
      ) {
        clearInactivityTimer();
        commandRecognitionRef.current = null;
        commandLaunchPendingRef.current = false;
        setDemoStateValue("unsupported");
        setErrorMessage(
          "Speech recognition is not available in this browser right now. Use typed input or try Chrome or Edge.",
        );
        return;
      }

      clearInactivityTimer();
      commandRecognitionRef.current = null;
      commandLaunchPendingRef.current = false;
      setDemoStateValue("error");
      setErrorMessage(
        event.error === "not-allowed"
          ? "Microphone permission was denied. Type a prompt instead or re-enable the mic permission."
          : "Voice transcription failed. Try again or type the request manually.",
      );

      if (wakeModeEnabledRef.current) {
        wakeRestartTimerRef.current = setTimeout(() => {
          void startWakeListening({ skipPermissionCheck: true });
        }, wakeRestartMs);
      }
    };

    recognition.onend = () => {
      clearInactivityTimer();
      commandRecognitionRef.current = null;
      commandLaunchPendingRef.current = false;

      setDemoState((current) => {
        const nextState =
          current === "processing"
            ? current
            : !speechSupportedRef.current
              ? "unsupported"
              : messagesRef.current.length
                ? "ready"
                : "idle";

        demoStateRef.current = nextState;
        return nextState;
      });

      if (
        wakeModeEnabledRef.current &&
        demoStateRef.current !== "processing"
      ) {
        wakeRestartTimerRef.current = setTimeout(() => {
          void startWakeListening({ skipPermissionCheck: true });
        }, wakeRestartMs);
      }
    };

    setErrorMessage(null);
    setDemoStateValue("listening");
    setSource("voice");

    try {
      recognition.start();
    } catch {
      commandRecognitionRef.current = null;
      commandLaunchPendingRef.current = false;
      setDemoStateValue("unsupported");
      setErrorMessage(
        "Speech recognition could not start in this browser. Use typed input or try Chrome or Edge.",
      );
      return;
    }

    resetInactivityTimer();
    commandLaunchPendingRef.current = false;
  }

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      if (wakeRestartTimerRef.current) {
        clearTimeout(wakeRestartTimerRef.current);
      }

      if (finalizeTimerRef.current) {
        clearTimeout(finalizeTimerRef.current);
      }

      commandRecognitionRef.current?.abort();
      wakeIgnoreEndRef.current = true;
      wakeRecognitionRef.current?.abort();
      commandRecognitionRef.current = null;
      wakeRecognitionRef.current = null;
    };
  }, []);

  async function handleMicClick() {
    if (!speechSupported) {
      setDemoStateValue("unsupported");
      return;
    }

    if (demoState === "listening") {
      stopCommandRecognition();
      return;
    }

    await startCommandListening();
  }

  async function handleWakeToggle() {
    if (!speechSupported) {
      setDemoStateValue("unsupported");
      return;
    }

    if (!wakeSupportedRef.current) {
      setWakeState("off");
      setDemoStateValue(messagesRef.current.length ? "ready" : "idle");
      setErrorMessage(null);
      return;
    }

    if (wakeModeEnabledRef.current) {
      wakeModeEnabledRef.current = false;
      setWakeModeEnabled(false);
      setWakeState("off");
      stopWakeRecognition({ abort: true, ignoreEnd: true });
      return;
    }

    wakeModeEnabledRef.current = true;
    setWakeModeEnabled(true);
    setWakeState("arming");
    setErrorMessage(null);
    await startWakeListening();
  }

  async function handleSubmit() {
    const trimmed = transcript.trim();

    if (!trimmed) {
      return;
    }

    if (demoState === "listening") {
      stopCommandRecognition();
    }

    setErrorMessage(null);
    setDemoStateValue("processing");

    try {
      const requestMode = mode === "general" ? inferMode(trimmed) : mode;
      const apiResponse = await fetch("/api/ask-rovik", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
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
        setMessages(payload.messages);
      });
      setConversationId(payload.conversationId);
      setMode(payload.mode);
      setTranscript("");
      setSource("typed");
      setDemoStateValue("ready");

      if (wakeModeEnabledRef.current) {
        wakeRestartTimerRef.current = setTimeout(() => {
          void startWakeListening({ skipPermissionCheck: true });
        }, wakeRestartMs);
      }
    } catch (error) {
      setDemoStateValue(speechSupported ? "error" : "unsupported");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The request failed before Rovik could respond.",
      );

      if (wakeModeEnabledRef.current) {
        wakeRestartTimerRef.current = setTimeout(() => {
          void startWakeListening({ skipPermissionCheck: true });
        }, wakeRestartMs);
      }
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

    setDemoStateValue(messages.length ? "ready" : "idle");
  }

  async function handleNewConversation() {
    setErrorMessage(null);
    await loadSession(true);
    setDemoStateValue("idle");
  }

  async function handleSignOut() {
    setAuthBusy(true);

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
      });
      setUser(null);
      await loadSession(false);
    } catch {
      setErrorMessage("Sign-out failed. Refresh the page and try again.");
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,16,27,0.92),rgba(5,12,22,0.96))] p-6 shadow-[0_28px_80px_rgba(2,8,17,0.34)] md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-[rgba(57,219,194,0.18)] bg-[rgba(57,219,194,0.09)] px-4 py-2 text-sm font-medium text-[rgba(177,245,232,0.92)]">
              {sessionLoading ? "Loading memory..." : statusLabel(demoState, wakeState)}
            </div>
            {user?.isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={authBusy}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {authBusy ? "Signing out..." : "Sign out"}
              </button>
            ) : (
              <a
                href="/api/auth/google?next=/demo"
                className="inline-flex items-center justify-center rounded-full border border-[rgba(57,219,194,0.22)] bg-[rgba(57,219,194,0.08)] px-4 py-2 text-sm font-medium text-[rgba(177,245,232,0.92)] transition duration-200 hover:-translate-y-0.5"
              >
                Continue with Google
              </a>
            )}
            <button
              type="button"
              onClick={handleNewConversation}
              disabled={sessionLoading || demoState === "processing"}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45"
            >
              New conversation
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-4">
            <RovikFace expression={expression} personality={personality} />
            <MicButton
              state={demoState}
              disabled={
                demoState === "processing" || !speechSupported || sessionLoading
              }
              onClick={handleMicClick}
            />
            <button
              type="button"
              onClick={handleWakeToggle}
              disabled={
                !speechSupported ||
                demoState === "processing" ||
                sessionLoading
              }
              className="inline-flex items-center justify-center rounded-full border border-[rgba(57,219,194,0.22)] bg-[rgba(57,219,194,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(177,245,232,0.92)] transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {wakeToggleLabel(wakeState, wakeModeEnabled, wakeSupported)}
            </button>
            <p className="max-w-40 text-center text-sm leading-6 text-white/52">
              {wakeDescription({
                speechSupported,
                wakeSupported,
                wakeState,
                wakeCompatibilityMessage:
                  speechProfileRef.current.wakeCompatibilityMessage,
              })}
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
            disabled={
              !transcript.trim() ||
              demoState === "processing" ||
              sessionLoading
            }
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
        <ConversationPanel
          messages={messages}
          state={demoState}
          errorMessage={errorMessage}
          user={user}
        />

        <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">
            Demo flow
          </p>
          <div className="mt-4 grid gap-3">
            {[
              "Sign in with Google or stay in guest mode.",
              "Start a conversation and ask a follow-up question naturally.",
              "Rovik keeps the thread, rolling memory, and recent turns together.",
              "Older context is compacted automatically before the model window overflows.",
              "The conversation is autosaved and finalized after inactivity.",
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

function statusLabel(state: DemoState, wakeState: WakeState) {
  if (state === "listening") {
    return "Listening...";
  }

  if (state === "processing") {
    return "Processing...";
  }

  if (wakeState === "arming") {
    return "Arming wake mode";
  }

  if (wakeState === "detected") {
    return "Wake word detected";
  }

  if (wakeState === "standby") {
    return "Wake mode active";
  }

  if (state === "ready") {
    return "Conversation ready";
  }

  if (state === "unsupported") {
    return "Manual text only";
  }

  if (state === "error") {
    return "Needs attention";
  }

  return "Ready";
}

function wakeToggleLabel(
  wakeState: WakeState,
  wakeModeEnabled: boolean,
  wakeSupported: boolean,
) {
  if (!wakeSupported) {
    return "Wake mode unavailable";
  }

  if (wakeState === "arming") {
    return "Arming wake mode";
  }

  if (wakeModeEnabled) {
    return "Disable wake mode";
  }

  return "Enable wake mode";
}

function wakeDescription({
  speechSupported,
  wakeSupported,
  wakeState,
  wakeCompatibilityMessage,
}: {
  speechSupported: boolean;
  wakeSupported: boolean;
  wakeState: WakeState;
  wakeCompatibilityMessage: string | null;
}) {
  if (!speechSupported) {
    return "Wake mode is unavailable in this browser. Use manual text input instead.";
  }

  if (!wakeSupported) {
    return (
      wakeCompatibilityMessage ??
      "Wake mode is unavailable in this browser. Use the mic button for a single command."
    );
  }

  if (wakeState === "arming") {
    return "Grant microphone access once so Rovik can keep listening for the wake word.";
  }

  if (wakeState === "standby") {
    return "Wake mode is armed. Say “Rovik” or “Hey Rovik” to start command capture.";
  }

  if (wakeState === "detected") {
    return "Wake word heard. Starting the command mic now.";
  }

  return "Arm wake mode once, or click the mic button for a manual command session.";
}
