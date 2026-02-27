import "./globals.css";
import type { Metadata } from "next";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { BabyProvider } from "@/components/BabyContext";
import { ThemeProvider } from "@/components/ThemeContext";
import { TourProvider, type Tour } from "@/components/ui/tour";
import AppLayout from "./AppLayout";

export const metadata: Metadata = {
  title: "Zen Nurture - Baby Care Tracker",
  description: "Track your baby's feeding, sleep, diapers, and more",
};

const MORA_TOUR = {
  id: "mora",
  steps: [
    {
      id: "mora-trigger",
      title: "Meet Mora",
      content:
        "Mora is your AI copilot for baby care. Click the Mora button anytime to open the assistant.",
    },
    {
      id: "mora-intro",
      title: "Mora sidebar",
      content:
        "Ask about feeds, sleep, diapers, reminders, or trends. Mora will ask for approval before making changes. Tap Tour to replay this guide.",
    },
    {
      id: "mora-prompts",
      title: "Quick prompts",
      content:
        "Tap one of these to get started instantly. Prompts change based on the page you're on.",
    },
    {
      id: "mora-composer",
      title: "Start chatting",
      content:
        "Type your question or tap the mic to speak. Mora reads live data and can propose changes—you'll approve or reject each action.",
    },
  ],
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
          <ThemeProvider>
            <TourProvider tours={[MORA_TOUR as Tour]}>
              <AuthGuard>
                <BabyProvider>
                  <AppLayout>{children}</AppLayout>
                </BabyProvider>
              </AuthGuard>
            </TourProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
