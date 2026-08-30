#!/usr/bin/env node
/**
 * Vérification de compatibilité iOS 12.5 avant republication.
 *
 * Usage: node scripts/check-ios12.mjs [--skip-build]
 *
 * 1. Construit le projet (sauf --skip-build)
 * 2. Vérifie la présence du bundle legacy (nomodule) et des polyfills
 * 3. Détecte toute syntaxe moderne non supportée par Safari 12 dans les
 *    chunks legacy (optional chaining, nullish coalescing, arrow functions,
 *    async/await, classes, template literals, spread d'objet)
 * 4. Affiche la checklist de test manuel guidé
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const skipBuild = process.argv.includes("--skip-build");

const ok = (m) => console.log(`  \u2713 ${m}`);
const fail = (m) => {
  console.error(`  \u2717 ${m}`);
  errors.push(m);
};
const errors = [];

if (!skipBuild) {
  console.log("\n[1/4] Build de production...");
  execSync("npx vite build", { stdio: "inherit", cwd: ROOT });
} else {
  console.log("\n[1/4] Build ignoré (--skip-build)");
}

if (!existsSync(DIST)) {
  console.error("dist/ introuvable — lance le build d'abord.");
  process.exit(1);
}

console.log("\n[2/4] Vérification du bundle legacy...");
const html = readFileSync(join(DIST, "index.html"), "utf8");
const assetsDir = join(DIST, "assets");
const assets = existsSync(assetsDir) ? readdirSync(assetsDir) : [];

const legacyChunks = assets.filter((f) => /-legacy.*\.js$/.test(f));
const polyfillChunks = assets.filter((f) => /polyfills.*\.js$/.test(f));

html.includes("nomodule")
  ? ok("index.html contient des scripts nomodule")
  : fail("aucun script nomodule dans index.html");
legacyChunks.length
  ? ok(`${legacyChunks.length} chunk(s) legacy générés`)
  : fail("aucun chunk *-legacy.js dans dist/assets");
polyfillChunks.length
  ? ok(`${polyfillChunks.length} bundle(s) de polyfills générés`)
  : fail("aucun bundle de polyfills (core-js) généré");
html.includes("System.import") || html.includes("__vite_legacy")
  ? ok("loader SystemJS legacy injecté")
  : fail("loader SystemJS legacy absent de index.html");

console.log("\n[3/4] Analyse syntaxique des chunks legacy (cible Safari 12 / ES2018)...");
const { parse } = await import("acorn");
// Safari 12 supporte ES2018 (arrow, spread, async) mais PAS ES2020 (?. ??)
const ES2020_ONLY = [
  [/\?\./, "optional chaining (?.)"],
  [/\?\?/, "nullish coalescing (??)"],
  [/\*\*=|[^*]\*\*[^*]/, "exponentiation (**)"],
  [/\bBigInt\b|\d+n\b/, "BigInt"],
];

for (const file of [...legacyChunks, ...polyfillChunks.filter((f) => /legacy/.test(f))]) {
  const code = readFileSync(join(assetsDir, file), "utf8");
  let syntaxOk = true;
  try {
    parse(code, { ecmaVersion: 2018, sourceType: "script" });
  } catch (e) {
    syntaxOk = false;
    fail(`${file} : syntaxe non supportée par Safari 12 → ${e.message}`);
  }
  const modern = ES2020_ONLY.filter(([re]) => re.test(code)).map(([, n]) => n);
  if (modern.length) {
    syntaxOk = false;
    fail(`${file} : opérateurs ES2020 non transpilés → ${modern.join(", ")}`);
  }
  if (syntaxOk) ok(`${file} : compatible Safari 12`);
}

console.log("\n[4/4] Test manuel guidé sur iOS 12.5");
console.log(readFileSync(join(ROOT, "docs", "ios12-manual-check.md"), "utf8"));

if (errors.length) {
  console.error(`\n\u274c ${errors.length} problème(s) de compatibilité — NE PAS republier.\n`);
  process.exit(1);
}
console.log("\n\u2705 Bundle compatible iOS 12.5. Effectue le test manuel puis republie.\n");
