declare global {
  type SpeechRecognitionResultLike = {
    isFinal: boolean;
    0: {
      transcript: string;
    };
  };

  type SpeechRecognitionEventLike = Event & {
    resultIndex: number;
    results: ArrayLike<SpeechRecognitionResultLike>;
  };

  type SpeechRecognitionErrorEventLike = Event & {
    error: string;
    message?: string;
  };

  interface SpeechRecognitionLike extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onend: ((event: Event) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognitionLike;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export {};
