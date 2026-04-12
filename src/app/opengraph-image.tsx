import { ImageResponse } from "next/og";
import { rovikCopy } from "@/lib/demo-content";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "46px",
          background:
            "radial-gradient(circle at top left, rgba(57,219,194,0.22) 0%, rgba(57,219,194,0) 36%), radial-gradient(circle at top right, rgba(255,178,87,0.18) 0%, rgba(255,178,87,0) 28%), linear-gradient(180deg, #040b14 0%, #08111c 100%)",
          color: "#f6fbff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            borderRadius: "36px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(9, 18, 30, 0.84)",
            padding: "40px",
            boxShadow: "0 24px 80px rgba(0, 0, 0, 0.26)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  color: "rgba(246,251,255,0.45)",
                }}
              >
                Rovik web demo
              </div>
              <div
                style={{
                  fontSize: "68px",
                  lineHeight: 0.96,
                  fontWeight: 800,
                  letterSpacing: "-0.08em",
                }}
              >
                {rovikCopy.name}
              </div>
            </div>
            <div
              style={{
                padding: "10px 18px",
                borderRadius: "999px",
                background: "rgba(57,219,194,0.14)",
                border: "1px solid rgba(57,219,194,0.22)",
                color: "#b1f5e8",
                fontSize: "18px",
              }}
            >
              Voice-first demo
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              maxWidth: "860px",
            }}
          >
            <div
              style={{
                fontSize: "76px",
                lineHeight: 1.02,
                fontWeight: 700,
                letterSpacing: "-0.05em",
              }}
            >
              Speak a task. Edit the transcript. Send it to Rovik.
            </div>
            <div
              style={{
                fontSize: "22px",
                lineHeight: 1.5,
                color: "rgba(246,251,255,0.66)",
              }}
            >
              {rovikCopy.pitch}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              marginTop: "auto",
            }}
          >
            {[
              { label: "Voice input", value: "Web Speech API" },
              { label: "AI engine", value: "Gemini 2.5 Flash" },
              { label: "Primary route", value: "/demo" },
            ].map((metric) => (
              <div
                key={metric.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  flex: 1,
                  padding: "20px 22px",
                  borderRadius: "24px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 700,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {metric.value}
                </div>
                <div
                  style={{
                    fontSize: "19px",
                    lineHeight: 1.35,
                    color: "rgba(246,251,255,0.52)",
                  }}
                >
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
