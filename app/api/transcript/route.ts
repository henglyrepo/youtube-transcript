import { NextRequest, NextResponse } from "next/server";
import {
  YoutubeTranscript,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
} from "youtube-transcript-plus";
import {
  formatAsJson,
  formatAsPlainText,
  formatAsSrt,
  formatAsVtt,
  formatAsHtml,
} from "@/lib/formatters";

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

type TranscriptFormat = "json" | "text" | "srt" | "vtt" | "html";
type TranscriptMethod = "auto" | "youtube-data-api" | "proxy";

interface TranscriptItem {
  text: string;
  start: number;
  duration: number;
}

interface VideoMetadata {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
}

const config = {
  youtubeDataApiKey: process.env.YOUTUBE_DATA_API_KEY,
  proxyUrl: process.env.PROXY_URL,
  transcriptMethod: (process.env.TRANSCRIPT_METHOD as TranscriptMethod) || "auto",
};

function maskProxyUrl(url: string | undefined): string {
  if (!url) return "not configured";
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      return `${parsed.protocol}//${parsed.username}:****@${parsed.host}`;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "invalid URL";
  }
}

function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || "Unknown Title",
        channelName: data.author_name || "Unknown Channel",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: "",
      };
    }
  } catch (error) {
    console.error("Metadata fetch error:", error);
  }

  return {
    title: "Unknown Title",
    channelName: "Unknown Channel",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    duration: "",
  };
}

async function fetchTranscriptViaYouTubeDataApi(
  videoId: string,
  language: string
): Promise<{ transcript: TranscriptItem[] | null; error?: string }> {
  if (!config.youtubeDataApiKey) {
    return { transcript: null, error: "youtube_data_api_key_missing" };
  }

  try {
    const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${config.youtubeDataApiKey}`;
    const videoResponse = await fetch(videoDetailsUrl);

    if (!videoResponse.ok) {
      console.error("YouTube Data API error: video details failed");
      return { transcript: null, error: "youtube_api_error" };
    }

    const videoData = await videoResponse.json();
    if (!videoData.items || videoData.items.length === 0) {
      return { transcript: null, error: "video_unavailable" };
    }

    const captionsUrl = `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${config.youtubeDataApiKey}`;
    const captionsResponse = await fetch(captionsUrl);

    if (!captionsResponse.ok) {
      console.error("YouTube Data API error: captions list failed");
      return { transcript: null, error: "youtube_api_error" };
    }

    const captionsData = await captionsResponse.json();

    if (!captionsData.items || captionsData.items.length === 0) {
      return { transcript: null, error: "captions_disabled" };
    }

    const captionTrack = captionsData.items.find(
      (item: { snippet: { language: string } }) =>
        item.snippet.language === language ||
        item.snippet.language.startsWith(language.split("-")[0])
    );

    if (!captionTrack) {
      return { transcript: null, error: "language_not_available" };
    }

    const captionId = captionTrack.id;
    const downloadUrl = `https://www.googleapis.com/youtube/v3/captions/${captionId}?tfmt=srt&key=${config.youtubeDataApiKey}`;

    return { transcript: null, error: "youtube_api_caption_download_not_supported" };
  } catch (error) {
    console.error("YouTube Data API error:", error);
    return { transcript: null, error: "youtube_api_error" };
  }
}

async function fetchTranscriptWithProxy(
  videoId: string,
  lang: string
): Promise<{ transcript: TranscriptItem[] | null; error?: string }> {
  if (!config.proxyUrl) {
    return { transcript: null, error: "proxy_not_configured" };
  }

  try {
    const proxyUrl = config.proxyUrl;

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang,
      videoFetch: async ({ url, lang: fetchLang, userAgent }) => {
        const headers: Record<string, string> = {};
        if (fetchLang) headers["Accept-Language"] = fetchLang;
        if (userAgent) headers["User-Agent"] = userAgent;
        return fetch(`${proxyUrl}${encodeURIComponent(url)}`, { headers });
      },
      playerFetch: async ({ url, method, body, lang: fetchLang, userAgent }) => {
        const fetchHeaders: Record<string, string> = {};
        if (fetchLang) fetchHeaders["Accept-Language"] = fetchLang;
        if (userAgent) fetchHeaders["User-Agent"] = userAgent;
        return fetch(`${proxyUrl}${encodeURIComponent(url)}`, {
          method,
          headers: fetchHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });
      },
      transcriptFetch: async ({ url, lang: fetchLang, userAgent }) => {
        const headers: Record<string, string> = {};
        if (fetchLang) headers["Accept-Language"] = fetchLang;
        if (userAgent) headers["User-Agent"] = userAgent;
        return fetch(`${proxyUrl}${encodeURIComponent(url)}`, { headers });
      },
    });
    return { transcript: transcript as unknown as TranscriptItem[] };
  } catch (error) {
    return handleTranscriptError(error);
  }
}

function handleTranscriptError(error: unknown): { transcript: null; error: string } {
  if (error instanceof YoutubeTranscriptTooManyRequestError) {
    return { transcript: null, error: "rate_limited" };
  }
  if (error instanceof YoutubeTranscriptVideoUnavailableError) {
    return { transcript: null, error: "video_unavailable" };
  }
  if (error instanceof YoutubeTranscriptDisabledError) {
    return { transcript: null, error: "captions_disabled" };
  }
  if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
    return { transcript: null, error: "language_not_available" };
  }
  if (error instanceof YoutubeTranscriptNotAvailableError) {
    return { transcript: null, error: "not_available" };
  }
  if (error instanceof Error) {
    console.error("Transcript fetch error:", error.message);
    return { transcript: null, error: "unknown_error" };
  }
  return { transcript: null, error: "unknown_error" };
}

const LANGUAGE_FALLBACKS: Record<string, string[]> = {
  en: ['en'],
  es: ['es', 'en'],
  fr: ['fr', 'en'],
  de: ['de', 'en'],
  it: ['it', 'en'],
  pt: ['pt', 'en'],
  ja: ['ja', 'en'],
  ko: ['ko', 'en'],
  zh: ['zh', 'en'],
  ru: ['ru', 'en'],
  ar: ['ar', 'en'],
  hi: ['hi', 'en'],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, language = "en", format = "json" } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL or ID is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL or video ID" },
        { status: 400 }
      );
    }

    console.log("Fetching transcript for video:", videoId, "Method:", config.transcriptMethod);

    const [metadata, transcriptResult] = await Promise.all([
      fetchVideoMetadata(videoId),
      fetchTranscriptWithFallback(videoId, language),
    ]);

    const transcript = transcriptResult.transcript;

    if (!transcript || transcript.length === 0) {
      const errorMessage = transcriptResult.error
        ? getErrorMessage(transcriptResult.error)
        : "No transcript available for this video";
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    let output: string;
    switch (format) {
      case "text":
        output = formatAsPlainText(transcript);
        break;
      case "srt":
        output = formatAsSrt(transcript);
        break;
      case "vtt":
        output = formatAsVtt(transcript);
        break;
      case "html":
        output = formatAsHtml(transcript);
        break;
      case "json":
      default:
        output = formatAsJson(transcript);
        break;
    }

    return NextResponse.json({
      success: true,
      videoId,
      format,
      data: output,
      raw: transcript,
      metadata,
    });
  } catch (error) {
    console.error("Transcript error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FetchResult {
  transcript: TranscriptItem[] | null;
  error?: string;
}

async function fetchTranscriptWithRetry(
  videoId: string,
  lang: string,
  retryCount = 0
): Promise<FetchResult> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang,
    });
    return { transcript: transcript as unknown as TranscriptItem[] };
  } catch (error) {
    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        await sleep(delay);
        return fetchTranscriptWithRetry(videoId, lang, retryCount + 1);
      }
      return { transcript: null, error: "rate_limited" };
    }

    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      return { transcript: null, error: "video_unavailable" };
    }

    if (error instanceof YoutubeTranscriptDisabledError) {
      return { transcript: null, error: "captions_disabled" };
    }

    if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
      return { transcript: null, error: "language_not_available" };
    }

    if (error instanceof YoutubeTranscriptNotAvailableError) {
      return { transcript: null, error: "not_available" };
    }

    if (error instanceof Error) {
      console.error("Unhandled error:", error.message);
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryCount);
        await sleep(delay);
        return fetchTranscriptWithRetry(videoId, lang, retryCount + 1);
      }
      return { transcript: null, error: "unknown_error" };
    }

    return { transcript: null, error: "unknown_error" };
  }
}

async function fetchTranscriptWithFallback(
  videoId: string,
  preferredLanguage: string
): Promise<{ transcript: TranscriptItem[] | null; error?: string }> {
  const method = config.transcriptMethod;
  const languagesToTry = LANGUAGE_FALLBACKS[preferredLanguage] || [preferredLanguage, "en"];

  if (method === "youtube-data-api") {
    console.log("Using YouTube Data API method");
    const result = await fetchTranscriptViaYouTubeDataApi(videoId, preferredLanguage);
    if (result.transcript) {
      return { transcript: result.transcript };
    }
    if (result.error === "youtube_api_caption_download_not_supported") {
      console.error("YouTube Data API does not support caption download. Use proxy or default method.");
      return { transcript: null, error: "youtube_api_caption_download_not_supported" };
    }
    if (result.error === "youtube_data_api_key_missing") {
      console.error("YouTube Data API key not configured");
      return { transcript: null, error: "youtube_data_api_key_missing" };
    }
    return { transcript: null, error: result.error };
  }

  if (method === "proxy") {
    console.log("Using proxy method");
    if (!config.proxyUrl) {
      console.error("Proxy URL not configured");
      return { transcript: null, error: "proxy_not_configured" };
    }
    for (const lang of languagesToTry) {
      const result = await fetchTranscriptWithProxy(videoId, lang);
      if (result.transcript) {
        return { transcript: result.transcript };
      }
      if (result.error === "video_unavailable" || result.error === "captions_disabled") {
        return { transcript: null, error: result.error };
      }
    }
    const result = await fetchTranscriptWithProxy(videoId, "en");
    return { transcript: result.transcript, error: result.error };
  }

  console.log("Using auto method (default youtube-transcript-plus)");
  for (const lang of languagesToTry) {
    const result = await fetchTranscriptWithRetry(videoId, lang);
    if (result.transcript) {
      return { transcript: result.transcript };
    }
    if (result.error === "video_unavailable" || result.error === "captions_disabled") {
      return { transcript: null, error: result.error };
    }
  }

  const result = await fetchTranscriptWithRetry(videoId, "en");
  return { transcript: result.transcript, error: result.error };
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "video_unavailable":
      return "This video is unavailable or private";
    case "captions_disabled":
      return "Captions are disabled for this video";
    case "rate_limited":
      return "Too many requests - please try again later";
    case "language_not_available":
      return "Transcript not available in selected language";
    case "not_available":
      return "No transcript available for this video";
    case "youtube_data_api_key_missing":
      return "YouTube Data API key not configured. Please set YOUTUBE_DATA_API_KEY environment variable.";
    case "youtube_api_caption_download_not_supported":
      return "YouTube Data API does not support caption download. Please use proxy method or default.";
    case "proxy_not_configured":
      return "Proxy not configured. Please set PROXY_URL environment variable.";
    case "unknown_error":
      return "Failed to fetch transcript - please try again";
    default:
      return "No transcript available for this video";
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Use POST method with videoUrl parameter' },
    { status: 405 }
  );
}
