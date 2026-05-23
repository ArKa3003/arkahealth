/**
 * Shared reference-retrieval types (Radiopaedia + curated WebMD corpus).
 */

export type ReferenceSource = "radiopaedia" | "webmd";

/** Cached / retrieved reference document for vector store and API responses. */
export interface ReferenceDoc {
  id?: string;
  source: ReferenceSource;
  title: string;
  excerpt: string;
  url: string;
  tags: string[];
  licensing: string;
  fetchedAt?: string;
}

export interface RadiopaediaHit {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  tags: string[];
  licensing: "CC-BY-NC-SA-3.0";
  fetchedAt: string;
}

export interface WebmdCorpusHit {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  tags: string[];
  licensing: string;
  fetchedAt: string;
}
