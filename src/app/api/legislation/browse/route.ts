// GET /api/legislation/browse — real stats over the curated local corpus.
// Serves the /legislation page; the corpus loader is the same one the
// local-laws search adapter uses (deterministic, no LLM).

import { NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CategoryStat {
  category: string;
  shortTitle: string;
  acts: number;
  articles: number;
}

/** Mirrors the loader's category → short title map (single source of truth is
 *  the loader; this lightweight copy is only for browsing stats). */
const CATEGORY_TITLES: Record<string, string> = {
  constitution: "ՀՀ Սահմանադրություն",
  "criminal-code": "ՀՀ քրեական օրենսգիրք",
  "criminal-procedure-code": "ՀՀ քրեական դատավարության օրենսգիրք",
  "civil-code": "ՀՀ քաղաքացիական օրենսգիրք",
  "civil-procedure-code": "ՀՀ քաղաքացիական դատավարության օրենսգիրք",
  "administrative-procedure-code": "ՀՀ վարչական դատավարության օրենսգիրք",
  "administrative-offences": "Վարչական իրավախախտումներ",
  bankruptcy: "Սնանկություն",
  judicial_code: "Դատական օրենսգիրք",
};

function countArticles(md: string): number {
  const normalized = md.replace(/\r\n/g, "\n");
  const matches = normalized.match(/^#{2,}\s*Հոդված\s+\d+/gm);
  return matches ? matches.length : 0;
}

export async function GET() {
  const dir = path.join(process.cwd(), "legal-data", "am");
  try {
    const categories = (await readdir(dir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    const out: CategoryStat[] = [];
    let totalActs = 0;
    let totalArticles = 0;

    for (const category of categories) {
      const catDir = path.join(dir, category);
      const files = (await readdir(catDir)).filter((f) => f.endsWith(".md")).sort();
      let acts = 0;
      let articles = 0;
      for (const file of files) {
        try {
          const raw = (await readFile(path.join(catDir, file), "utf-8")).replace(/\r\n/g, "\n");
          const articleCount = countArticles(raw);
          if (articleCount > 0) {
            acts += 1;
            articles += articleCount;
          }
        } catch {
          /* skip unreadable file */
        }
      }
      if (acts > 0) {
        out.push({
          category,
          shortTitle: CATEGORY_TITLES[category] ?? category,
          acts,
          articles,
        });
        totalActs += acts;
        totalArticles += articles;
      }
    }

    return NextResponse.json({ stats: { acts: totalActs, articles: totalArticles, categories: out, available: true } });
  } catch {
    return NextResponse.json({ stats: { acts: 0, articles: 0, categories: [], available: false } }, { status: 200 });
  }
}
