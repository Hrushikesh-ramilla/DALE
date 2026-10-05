import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BuyerGuard — shop with confidence",
  description:
    "Find the right fit, pay safely, and get support that puts you first.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
