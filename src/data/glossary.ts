import rawGlossary from "./glossary.json";

export interface GlossaryEntry {
  id: string;
  slug: string;
  term: string;
  definition: string;
  shortDefinition: string;
}

export const GLOSSARY: GlossaryEntry[] = rawGlossary.map((g: any) => ({
  id: g.id,
  slug: g.term.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
  term: g.term,
  definition: g.shortDefinition,
  shortDefinition: g.shortDefinition,
}));

export default GLOSSARY;
