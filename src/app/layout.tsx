import "./globals.css";
import type { Metadata } from "next";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import AppLayout from "./AppLayout";

export const metadata: Metadata = {
  title: "Zen Nurture - Baby Care Tracker",
  description: "Track your baby's feeding, sleep, diapers, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>
        <ConvexClientProvider>
          <AppLayout>{children}</AppLayout>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
