import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Rovik | Voice web demo",
  description:
    "Voice-first web demo for Rovik with browser speech recognition, editable transcript input, and structured Gemini responses.",
  metadataBase: new URL("https://rovik-demo-page.vercel.app"),
  keywords: [
    "Rovik",
    "voice demo",
    "speech recognition",
    "Gemini",
    "AI assistant",
    "Next.js demo",
  ],
  openGraph: {
    title: "Rovik | Voice web demo",
    description:
      "Speak a task, edit the transcript, and send it to Rovik for a structured Gemini response.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rovik | Voice web demo",
    description:
      "A voice-first Rovik demo with transcript capture and structured AI responses.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#040b14]">{children}</body>
    </html>
  );
}
