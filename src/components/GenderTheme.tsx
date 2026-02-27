"use client";

import { useMemo } from "react";
import { useBaby } from "@/components/BabyContext";

export type GenderTheme = "baby-boy" | "baby-girl" | "default";

interface GenderThemeColors {
  primary: string;
  primaryLight: string;
  primaryLighter: string;
  text: string;
  textLight: string;
  bg: string;
  bgSubtle: string;
  border: string;
  gradient: string;
  gradientSubtle: string;
  icon: string;
  emoji: string;
  celebrationEmoji: string[];
  greeting: string[];
  accentPattern: string;
  accentClass: string;
}

const GENDER_THEMES: Record<GenderTheme, GenderThemeColors> = {
  "baby-boy": {
    primary: "bg-baby-blue",
    primaryLight: "bg-baby-blue/20",
    primaryLighter: "bg-baby-blue/10",
    text: "text-baby-blue",
    textLight: "text-baby-blue/70",
    bg: "bg-baby-blue/5",
    bgSubtle: "bg-baby-blue/[0.02]",
    border: "border-baby-blue/20",
    gradient: "from-baby-blue/20 to-transparent",
    gradientSubtle: "from-baby-blue/5",
    icon: "text-baby-blue",
    emoji: "♂️",
    celebrationEmoji: ["⭐", "🚀", "🦁", "⚡", "🌟", "🎮"],
    greeting: ["Hey little champion!", "Ready for adventure!", "Time for fun!", "My little star!"],
    accentPattern: "radial-gradient(circle at 20% 30%, rgba(107, 163, 214, 0.15) 0 25%, transparent 26%)",
    accentClass: "bg-baby-blue-accent",
  },
  "baby-girl": {
    primary: "bg-baby-pink",
    primaryLight: "bg-baby-pink/20",
    primaryLighter: "bg-baby-pink/10",
    text: "text-baby-pink",
    textLight: "text-baby-pink/70",
    bg: "bg-baby-pink/5",
    bgSubtle: "bg-baby-pink/[0.02]",
    border: "border-baby-pink/20",
    gradient: "from-baby-pink/20 to-transparent",
    gradientSubtle: "from-baby-pink/5",
    icon: "text-baby-pink",
    emoji: "♀️",
    celebrationEmoji: ["🌸", "🦄", "💖", "✨", "🌺", "🎀"],
    greeting: ["Hello princess!", "Sweet little one!", "Time for cuddles!", "My little sunshine!"],
    accentPattern: "radial-gradient(circle at 80% 20%, rgba(232, 164, 184, 0.15) 0 25%, transparent 26%)",
    accentClass: "bg-baby-pink-accent",
  },
  default: {
    primary: "bg-sage",
    primaryLight: "bg-sage/20",
    primaryLighter: "bg-sage/10",
    text: "text-sage",
    textLight: "text-sage/70",
    bg: "bg-sage/5",
    bgSubtle: "bg-sage/[0.02]",
    border: "border-sage/20",
    gradient: "from-sage/20 to-transparent",
    gradientSubtle: "from-sage/5",
    icon: "text-sage",
    emoji: "👶",
    celebrationEmoji: ["🌱", "💚", "🌿", "☀️", "🌼", "🕊️"],
    greeting: ["Hello sweetie!", "Good morning!", "Time for a log!", "Let's track today!"],
    accentPattern: "radial-gradient(circle at 18% 18%, rgba(124, 154, 130, 0.14) 0 22%, transparent 23%)",
    accentClass: "",
  },
};

export function useGenderTheme(): GenderThemeColors {
  const { activeBaby } = useBaby();
  
  return useMemo(() => {
    const gender = activeBaby?.gender;
    if (gender === "baby-boy") return GENDER_THEMES["baby-boy"];
    if (gender === "baby-girl") return GENDER_THEMES["baby-girl"];
    return GENDER_THEMES["default"];
  }, [activeBaby?.gender]);
}

export function useGenderThemeType(): GenderTheme {
  const { activeBaby } = useBaby();
  
  return useMemo(() => {
    const gender = activeBaby?.gender;
    if (gender === "baby-boy") return "baby-boy";
    if (gender === "baby-girl") return "baby-girl";
    return "default";
  }, [activeBaby?.gender]);
}

export function useGenderEmoji(): string {
  const { activeBaby } = useBaby();
  
  return useMemo(() => {
    const gender = activeBaby?.gender;
    if (gender === "baby-boy") return "♂️";
    if (gender === "baby-girl") return "♀️";
    return "👶";
  }, [activeBaby?.gender]);
}

export function useGenderGreeting(): string {
  const theme = useGenderTheme();
  
  return useMemo(() => {
    const greetings = theme.greeting;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [theme.greeting]);
}

export function useRandomCelebrationEmoji(): string {
  const theme = useGenderTheme();
  
  return useMemo(() => {
    const emojis = theme.celebrationEmoji;
    return emojis[Math.floor(Math.random() * emojis.length)];
  }, [theme.celebrationEmoji]);
}
