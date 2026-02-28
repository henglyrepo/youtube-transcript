"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { Orb } from "@/components/ui/orb-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Download, Moon, Sun, Youtube, Sparkles, ChevronDown, ChevronUp, Github } from "lucide-react";
import { summarizeText, SUMMARY_STYLES, SUMMARY_LENGTHS, SummaryStyle } from "@/lib/summarizer";
import { getHistory, addToHistory, clearHistory, formatTimestamp, HistoryEntry } from "@/lib/history";

type TranscriptFormat = "json" | "text" | "srt" | "vtt" | "html";

interface VideoMetadata {
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
}

interface TranscriptResponse {
  success: boolean;
  videoId: string;
  format: string;
  data: string;
  raw: Array<{ text: string; start?: number; offset?: number; duration: number }>;
  metadata?: VideoMetadata;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

const FORMATS: { value: TranscriptFormat; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "text", label: "Plain Text" },
  { value: "srt", label: "SRT" },
  { value: "vtt", label: "VTT" },
  { value: "html", label: "HTML" },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [videoUrl, setVideoUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [format, setFormat] = useState<TranscriptFormat>("json");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranscriptResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyOpen, setHistoryOpen] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>("tldr");
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium");

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const filteredRaw = result?.raw?.filter((segment) =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDisplayData = () => {
    if (!result) return "";
    if (searchQuery && filteredRaw) {
      return filteredRaw.map((s) => s.text).join("\n");
    }
    return result.data;
  };

  const sanitizeFilename = (title: string): string => {
    return title.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").substring(0, 50).trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      toast.error("Please enter a YouTube URL or video ID");
      return;
    }

    setLoading(true);
    setResult(null);
    setSummary("");
    setSummaryError("");

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, language, format }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transcript");
      }

      setResult(data);

      const plainText = data.raw.map((s: { text: string }) => s.text).join(" ");
      const preview = plainText.substring(0, 100) + (plainText.length > 100 ? "..." : "");

      addToHistory({
        videoUrl,
        videoId: data.videoId,
        language,
        format,
        preview,
      });

      setHistory(getHistory());
      toast.success("Transcript fetched successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!result?.raw) return;

    setSummarizing(true);
    setSummaryError("");

    const plainText = result.raw.map((s) => s.text).join(" ");

    const res = await summarizeText(plainText, {
      type: summaryStyle,
      length: summaryLength,
    });

    if (res.success && res.summary) {
      setSummary(res.summary);
      toast.success("Summary generated!");
    } else {
      setSummaryError(res.error || "Failed to generate summary");
      toast.error(res.error || "Failed to generate summary");
    }

    setSummarizing(false);
  };

  const handleCopy = async () => {
    if (!result) return;
    const dataToCopy = searchQuery && filteredRaw
      ? filteredRaw.map((s) => s.text).join("\n")
      : result.data;
    await navigator.clipboard.writeText(dataToCopy);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const dataToDownload = searchQuery && filteredRaw
      ? filteredRaw.map((s) => s.text).join("\n")
      : result.data;
    const extensions: Record<string, string> = {
      json: "json",
      text: "txt",
      srt: "srt",
      vtt: "vtt",
      html: "html",
    };
    const mimeTypes: Record<string, string> = {
      json: "application/json",
      text: "text/plain",
      srt: "application/x-subrip",
      vtt: "text/vtt",
      html: "text/html",
    };
    const ext = extensions[result.format] || "txt";
    const mime = mimeTypes[result.format] || "text/plain";
    const title = result.metadata?.title ? sanitizeFilename(result.metadata.title) : result.videoId;
    const blob = new Blob([dataToDownload], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${title}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    setVideoUrl(entry.videoUrl);
    setLanguage(entry.language);
    setFormat(entry.format as TranscriptFormat);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast.success("History cleared");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-zinc-950 to-zinc-950 dark:from-blue-950/40 dark:via-zinc-950 dark:to-zinc-950" />

      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full hover:bg-zinc-800/80"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-zinc-400" />
          ) : (
            <Moon className="h-5 w-5 text-zinc-600" />
          )}
        </Button>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-blue-500/20" />
              <div className="relative">
                <Orb size="lg" />
              </div>
            </div>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-zinc-50">
            YouTube Transcript
          </h1>
          <p className="text-lg text-zinc-400">
            Extract transcripts from any YouTube video in multiple formats
          </p>
          <a
            href="https://github.com/henglyrepo"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Github className="h-4 w-4" />
            Developed by @henglyrepo
          </a>
        </div>

        <Card className="mb-4 border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl shadow-2xl shadow-black/20">
          <CardHeader className="border-b border-zinc-800/50 pb-6">
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Youtube className="h-5 w-5 text-red-500" />
              Fetch Transcript
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Enter a YouTube URL or video ID to extract its transcript
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-zinc-300">
                  YouTube Video URL or ID
                </Label>
                <Input
                  id="videoUrl"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or video ID"
                  className="border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-zinc-300">
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="border-zinc-700 bg-zinc-800/50 text-zinc-100">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-700 bg-zinc-900">
                      {LANGUAGES.map((lang) => (
                        <SelectItem
                          key={lang.code}
                          value={lang.code}
                          className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format" className="text-zinc-300">
                    Output Format
                  </Label>
                  <Select
                    value={format}
                    onValueChange={(v) => setFormat(v as TranscriptFormat)}
                  >
                    <SelectTrigger className="border-zinc-700 bg-zinc-800/50 text-zinc-100">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-700 bg-zinc-900">
                      {FORMATS.map((f) => (
                        <SelectItem
                          key={f.value}
                          value={f.value}
                          className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Transcript...
                  </>
                ) : (
                  "Get Transcript"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-4 border-zinc-800/50 bg-zinc-900/30 backdrop-blur-xl">
          <CardHeader 
            className="cursor-pointer border-b border-zinc-800/50 pb-4 hover:bg-zinc-800/30"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <span>History ({history.length})</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearHistory();
                    }}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Clear
                  </Button>
                )}
                {historyOpen ? (
                  <ChevronUp className="h-5 w-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-zinc-400" />
                )}
              </div>
            </div>
          </CardHeader>
          {historyOpen && (
            <CardContent className="pt-4">
              {history.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No history yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.slice(0, 10).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleLoadHistory(entry)}
                      className="w-full rounded-lg border border-zinc-800 p-3 text-left transition-colors hover:bg-zinc-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200">{entry.videoId}</span>
                        <span className="text-xs text-zinc-500">{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                          {entry.format.toUpperCase()}
                        </span>
                        <span className="truncate text-xs text-zinc-500">{entry.preview}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {result && (
          <Card className="mb-4 border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl shadow-2xl shadow-black/20">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              {result.metadata && (
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={result.metadata.thumbnailUrl}
                    alt={result.metadata.title}
                    className="w-32 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://img.youtube.com/vi/hqdefault.jpg";
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100 line-clamp-2">
                      {result.metadata.title}
                    </h3>
                    <p className="text-sm text-zinc-400">{result.metadata.channelName}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20"
                  >
                    Success
                  </Badge>
                  <span className="text-sm text-zinc-500">
                    Video ID: {result.videoId}
                  </span>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    {format.toUpperCase()}
                  </Badge>
                  {searchQuery && (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                      {filteredRaw?.length || 0} / {result.raw.length} results
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-4">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search within transcript..."
                  className="border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500"
                />
              </div>
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="mb-4 bg-zinc-800/50">
                  <TabsTrigger
                    value="preview"
                    className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
                  >
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="raw"
                    className="data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100"
                  >
                    Raw Data
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preview">
                  <div className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                    {format === "html" && !searchQuery ? (
                      <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: result.data }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap break-words text-sm text-zinc-300 font-mono">
                        {getDisplayData()}
                      </pre>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="raw">
                  <div className="max-h-96 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                    <pre className="whitespace-pre-wrap break-words text-sm text-zinc-300 font-mono">
                      {JSON.stringify(result.raw, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl shadow-2xl shadow-black/20">
            <CardHeader className="border-b border-zinc-800/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Sparkles className="h-5 w-5 text-purple-400" />
                AI Summary
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Generate an AI-powered summary of the transcript
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Summary Style</Label>
                  <Select
                    value={summaryStyle}
                    onValueChange={(v) => setSummaryStyle(v as SummaryStyle)}
                  >
                    <SelectTrigger className="border-zinc-700 bg-zinc-800/50 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-700 bg-zinc-900">
                      {SUMMARY_STYLES.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          {s.label} - {s.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Summary Length</Label>
                  <Select
                    value={summaryLength}
                    onValueChange={(v) => setSummaryLength(v as "short" | "medium" | "long")}
                  >
                    <SelectTrigger className="border-zinc-700 bg-zinc-800/50 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-700 bg-zinc-900">
                      {SUMMARY_LENGTHS.map((l) => (
                        <SelectItem
                          key={l.value}
                          value={l.value}
                          className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                        >
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSummarize}
                disabled={summarizing || !result?.raw}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {summarizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>

              {summaryError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-sm text-red-400">{summaryError}</p>
                </div>
              )}

              {summary && (
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4 max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm text-purple-200 font-mono">
                    {summary}
                  </pre>
                </div>
              )}

              {!summary && !summaryError && !summarizing && (
                <p className="text-sm text-zinc-500">
                  Click "Generate Summary" to get an AI-powered summary using Chrome's built-in AI.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
