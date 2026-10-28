import type { Metadata } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import { MotionProvider } from "@/components/motion-provider";
import { LuxuryCursor } from "@/components/luxury-cursor";
import "./fonts.css";
import "./globals.css";
import "./monochrome.css";
import "./agent.css";
import "./copilot.css";
import "./depth.css";
import "lenis/dist/lenis.css";
import { CopilotProvider } from "@/components/copilot/copilot-context";
import { DaleCopilotSidecar } from "@/components/copilot/dale-copilot-sidecar";
export const metadata: Metadata = {
  title: "DALE — shop with confidence",
  applicationName: "DALE",
  description:
    "Find the right fit, pay safely, and get support that puts you first.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="auto">
      <body>
        <MotionProvider>
          <CopilotProvider>
            {children}
            <DaleCopilotSidecar />
          </CopilotProvider>
          <LuxuryCursor />
        </MotionProvider>
      </body>
    </html>
  );
}
