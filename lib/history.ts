export interface HistoryEntry {
  id: string;
  videoUrl: string;
  videoId: string;
  language: string;
  format: string;
  timestamp: number;
  preview: string;
}

const STORAGE_KEY = "youtube-transcript-history";
const MAX_HISTORY_ITEMS = 50;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry {
  const history = getHistory();

  const existingIndex = history.findIndex((h) => h.videoId === entry.videoId && h.format === entry.format);

  if (existingIndex !== -1) {
    history.splice(existingIndex, 1);
  }

  const newEntry: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  history.unshift(newEntry);

  const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));

  return newEntry;
}

export function removeFromHistory(id: string): void {
  const history = getHistory();
  const filtered = history.filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
