import type { RovikExpression } from "@/lib/demo-types";

type RovikFaceProps = {
  expression: RovikExpression;
};

const expressionLabel: Record<RovikExpression, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  success: "Success",
  confused: "Confused",
  error: "Error",
};

export function RovikFace({ expression }: RovikFaceProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rovik-face-shell">
        <div className={`rovik-face-screen rovik-face-screen--${expression}`}>
          <FaceGlyph expression={expression} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-white/42">
          Rovik expression
        </p>
        <p className="mt-2 text-sm text-white/68">{expressionLabel[expression]}</p>
      </div>
    </div>
  );
}

function FaceGlyph({ expression }: { expression: RovikExpression }) {
  if (expression === "listening") {
    return (
      <div className="rovik-face-glyph">
        <span className="rovik-eye rovik-eye--dot rovik-eye--listening" />
        <span className="rovik-eye rovik-eye--dot rovik-eye--listening" />
      </div>
    );
  }

  if (expression === "thinking") {
    return (
      <div className="rovik-face-glyph">
        <span className="rovik-eye rovik-eye--spiral">◎</span>
        <span className="rovik-eye rovik-eye--spiral">◎</span>
      </div>
    );
  }

  if (expression === "speaking") {
    return (
      <div className="rovik-face-glyph rovik-face-glyph--speaking">
        <span className="rovik-eye rovik-eye--bar" />
        <span className="rovik-eye rovik-eye--bar" />
        <span className="rovik-mouth rovik-mouth--speaking" />
      </div>
    );
  }

  if (expression === "success") {
    return (
      <div className="rovik-face-glyph">
        <span className="rovik-eye rovik-eye--cheer" />
        <span className="rovik-eye rovik-eye--cheer" />
      </div>
    );
  }

  if (expression === "confused") {
    return (
      <div className="rovik-face-glyph">
        <span className="rovik-eye rovik-eye--tilted-left" />
        <span className="rovik-eye rovik-eye--tilted-right" />
        <span className="rovik-confused-mark">?</span>
      </div>
    );
  }

  if (expression === "error") {
    return (
      <div className="rovik-face-glyph">
        <span className="rovik-eye rovik-eye--warning-left" />
        <span className="rovik-eye rovik-eye--warning-right" />
      </div>
    );
  }

  return (
    <div className="rovik-face-glyph">
      <span className="rovik-eye rovik-eye--idle" />
      <span className="rovik-eye rovik-eye--idle" />
    </div>
  );
}
