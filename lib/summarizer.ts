/* eslint-disable @typescript-eslint/no-explicit-any */
export type SummaryStyle = "tldr" | "teaser" | "headline";

export interface SummarizerOptions {
  type?: SummaryStyle;
  length?: "short" | "medium" | "long";
}

export interface SummarizerResult {
  success: boolean;
  summary?: string;
  error?: string;
}

declare global {
  interface Window {
    ai?: {
      summarizer?: {
        available(): Promise<"no" | "readily" | "after-download">;
        create(options?: {
          monitor?(m: any): void;
        }): Promise<any>;
      };
    };
  }
}

export async function summarizeText(
  text: string,
  options: SummarizerOptions = {}
): Promise<SummarizerResult> {
  const { type = "tldr", length = "medium" } = options;

  try {
    const available = await window.ai?.summarizer?.available();

    if (available === "no") {
      return {
        success: false,
        error: "Summarizer is not available in your browser. Please use Chrome or Edge.",
      };
    }

    let summarizer;

    if (available === "readily") {
      summarizer = await window.ai!.summarizer!.create();
    } else {
      summarizer = await window.ai!.summarizer!.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => {
            console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
          });
        },
      });
      await summarizer.ready;
    }

    const summary = await summarizer.summarize(text, { type, length });
    summarizer.destroy();

    return {
      success: true,
      summary,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Summarization failed",
    };
  }
}

export const SUMMARY_STYLES: { value: SummaryStyle; label: string; description: string }[] = [
  { value: "tldr", label: "TL;DR", description: "Bullet point summary" },
  { value: "teaser", label: "Short", description: "Brief 1-2 sentence summary" },
  { value: "headline", label: "Detailed", description: "Comprehensive summary" },
];

export const SUMMARY_LENGTHS: { value: "short" | "medium" | "long"; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];
