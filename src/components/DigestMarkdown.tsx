"use client";

import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node)
    return extractText((node as { props: { children?: React.ReactNode } }).props.children);
  return "";
}

const SECTION_LABELS: Record<string, { variant?: "default" | "secondary" | "outline"; icon?: string }> = {
  Highlights: { variant: "secondary", icon: "star" },
  "Comparison to Last Week": { variant: "outline", icon: "compare_arrows" },
  Watch: { variant: "outline", icon: "visibility" },
  Tip: { variant: "secondary", icon: "lightbulb" },
};

function getSectionConfig(text: string) {
  const key = Object.keys(SECTION_LABELS).find((k) =>
    text.trim().toLowerCase().startsWith(k.toLowerCase())
  );
  return key ? SECTION_LABELS[key] : null;
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold text-espresso mb-3 mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold text-espresso mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-espresso mt-3 mb-1.5">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => {
    const text = extractText(children);
    const config = getSectionConfig(text);
    if (config && text.length < 50) {
      return (
        <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
          {config.icon && (
            <span className="material-symbols-outlined text-sage text-[18px]">{config.icon}</span>
          )}
          <Badge
            variant={config.variant ?? "secondary"}
            className="border-sage/30 bg-sage/10 text-sage font-semibold"
          >
            {children}
          </Badge>
        </div>
      );
    }
    return <p className="text-[13px] text-espresso leading-relaxed mb-2 last:mb-0">{children}</p>;
  },
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-espresso">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="space-y-1.5 mb-3 pl-0 list-none">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="space-y-1.5 mb-3 pl-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="flex gap-2 text-[13px] text-espresso leading-relaxed">
      <span className="text-sage shrink-0">•</span>
      <span>{children}</span>
    </li>
  ),
};

interface DigestMarkdownProps {
  content: string;
  className?: string;
}

export default function DigestMarkdown({ content, className }: DigestMarkdownProps) {
  return (
    <div className={cn("digest-prose", className)}>
      <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
    </div>
  );
}
