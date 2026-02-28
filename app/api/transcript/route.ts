import { NextRequest, NextResponse } from 'next/server';
import {
  YoutubeTranscript,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
} from 'youtube-transcript-plus';
import {
  formatAsJson,
  formatAsPlainText,
  formatAsSrt,
  formatAsVtt,
  formatAsHtml,
} from '@/lib/formatters';

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

type TranscriptFormat = 'json' | 'text' | 'srt' | 'vtt' | 'html';

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
        title: data.title || 'Unknown Title',
        channelName: data.author_name || 'Unknown Channel',
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: '',
      };
    }
  } catch (error) {
    console.error('Metadata fetch error:', error);
  }

  return {
    title: 'Unknown Title',
    channelName: 'Unknown Channel',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    duration: '',
  };
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
    const { videoUrl, language = 'en', format = 'json' } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL or ID is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL or video ID' },
        { status: 400 }
      );
    }

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
      case 'text':
        output = formatAsPlainText(transcript);
        break;
      case 'srt':
        output = formatAsSrt(transcript);
        break;
      case 'vtt':
        output = formatAsVtt(transcript);
        break;
      case 'html':
        output = formatAsHtml(transcript);
        break;
      case 'json':
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
    console.error('Transcript error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
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
  const languagesToTry = LANGUAGE_FALLBACKS[preferredLanguage] || [preferredLanguage, 'en'];

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
