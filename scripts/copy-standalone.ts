// Cross-platform standalone-output finalizer (replaces Unix-only `cp -r`).
// After `next build` with output:"standalone", the server needs:
//   .next/static  -> .next/standalone/.next/static
//   public        -> .next/standalone/public
// Works on Windows and POSIX alike.

import { cpSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error(
    "[copy-standalone] .next/standalone not found — run `next build` first.",
  );
  process.exit(1);
}

cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});
cpSync(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true,
});
console.log("[copy-standalone] static + public copied into .next/standalone");
