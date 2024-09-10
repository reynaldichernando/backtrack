import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BackTrack",
  description: "Standalone YouTube Media Library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
