// Account sync for notes, bookmarks, highlights and progress. The Lovable
// build has no account server yet, so these are only called when a reader is
// signed in, which does not happen here. Kept so the shared code compiles.
import { apiRequest } from "@/lib/queryClient";

type Json = Record<string, unknown>;
const call = async (method: string, url: string, body?: unknown) => {
  const res = await apiRequest(method, url, body);
  return res.status === 204 ? undefined : res.json();
};

export const progressAPI = {
  get: () => call("GET", "/api/reading-progress"),
  update: (resumeSlug?: string, completedChapters?: string[]) => call("PUT", "/api/reading-progress", { resumeSlug, completedChapters }),
};
export const notesAPI = {
  create: (note: Json) => call("POST", "/api/notes", note),
  delete: (id: string) => call("DELETE", `/api/notes/${id}`),
};
export const bookmarksAPI = {
  create: (bookmark: Json) => call("POST", "/api/bookmarks", bookmark),
  delete: (id: string) => call("DELETE", `/api/bookmarks/${id}`),
};
export const highlightsAPI = {
  create: (highlight: Json) => call("POST", "/api/highlights", highlight),
  delete: (id: string) => call("DELETE", `/api/highlights/${id}`),
};
