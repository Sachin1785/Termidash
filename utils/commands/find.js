const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");
const os = require("os");
const { queryNative } = require("../providers/nativeProvider");

// Dependency folder names that are "heavy" — highlighted specially
const HEAVY_FOLDERS = new Set([
  "node_modules",
  ".venv",
  "venv",
  ".next",
  ".nuxt",
  "dist",
  "build",
  "__pycache__",
  ".gradle",
  ".cargo",
  "target",
  ".cache",
]);

/**
 * Fallback: plain recursive fs scan rooted at `rootDir`.
 * Used only when no system index is available.
 *
 * @param {string} rootDir
 * @param {string} query
 * @param {"file"|"folder"|"all"} type
 * @returns {string[]}
 */
function fsScan(rootDir, query, type) {
  const results = [];
  const lq = query.toLowerCase();

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // permission denied — skip
    }

    for (const entry of entries) {
      // Skip hidden system dirs during traversal
      if (entry.name === ".git" || entry.name === "Windows") continue;

      const fullPath = path.join(dir, entry.name);
      const isDir = entry.isDirectory();
      const matchesType =
        type === "all" || (type === "folder" && isDir) || (type === "file" && !isDir);

      if (matchesType && entry.name.toLowerCase().includes(lq)) {
        results.push(fullPath);
      }

      if (isDir && entry.name !== "node_modules") {
        walk(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

/**
 * Format and print results to the terminal.
 *
 * @param {string[]} results
 * @param {string} query
 * @param {object} chalk - chalk instance
 */
function printResults(results, query, chalk) {
  if (results.length === 0) {
    console.log(chalk.yellow(`  No results found for "${query}".`));
    return;
  }

  for (const p of results) {
    const name = path.basename(p);
    const dir = path.dirname(p);
    const isHeavy = HEAVY_FOLDERS.has(name);

    if (isHeavy) {
      // Heavy dependency folders get a warning colour + size hint
      let sizeLabel = "";
      try {
        // Only compute size of direct contents to stay fast
        const entries = fs.readdirSync(p);
        sizeLabel = chalk.dim(` [${entries.length} items]`);
      } catch {
        /* ignore */
      }
      console.log(
        chalk.red("  ⬡ ") +
          chalk.red.bold(name) +
          chalk.dim("  in  ") +
          chalk.cyan(dir) +
          sizeLabel
      );
    } else {
      // Regular result
      try {
        const stat = fs.statSync(p);
        const icon = stat.isDirectory() ? "📁" : "📄";
        console.log(
          `  ${icon} ` + chalk.green.bold(name) + chalk.dim("  →  ") + chalk.cyan(dir)
        );
      } catch {
        console.log("  📄 " + chalk.green.bold(name) + chalk.dim("  →  ") + chalk.cyan(dir));
      }
    }
  }
}

/**
 * Main entry-point for `bruh find <query> [--files|--folders]`.
 *
 * Resolution order:
 *   1. Everything (voidtools) — Windows, MFT-direct, ~2ms
 *   2. OS-native index     — Windows Search / mdfind / locate
 *   3. fs scan (fallback)  — rooted at cwd, slower
 *
 * @param {string[]} args  - CLI args after "find"
 * @param {object}  settings - loaded config
 */
async function find(args, settings) {
  const chalk = (await import("chalk")).default;

  // ── Parse args ──────────────────────────────────────────────────────────────
  const flags = args.filter((a) => a.startsWith("--"));
  const positional = args.filter((a) => !a.startsWith("--"));
  const query = positional[0];

  if (!query) {
    console.log(chalk.red("  Error: ") + "Please provide a search query.");
    console.log(chalk.dim("  Usage: ") + "bruh find <query> [--files] [--folders] [--global]");
    return;
  }

  let type = "all";
  if (flags.includes("--files")) type = "file";
  else if (flags.includes("--folders")) type = "folder";
  
  const isGlobal = flags.includes("--global");

  const typeLabel =
    type === "file" ? "files" : type === "folder" ? "folders" : "files & folders";
  const scopeLabel = isGlobal ? "globally (all drives)" : "in current folder";

  console.log(
    chalk.blue.bold(`\n  🔍 Searching for ${typeLabel} matching `) +
      chalk.white.bold(`"${query}" `) +
      chalk.dim(scopeLabel) +
      chalk.blue.bold("...\n")
  );

  const start = Date.now();
  const currentDir = process.cwd();

  // ── Tier 1: OS-native index ──────────────────────────────────────────────────
  const tierNative = queryNative(query, type, currentDir, isGlobal);
  if (tierNative.available && tierNative.results.length > 0) {
    const elapsed = Date.now() - start;
    console.log(
      chalk.green("  ✓ Provider: ") +
        chalk.white(tierNative.providerName) +
        chalk.dim(`  [${elapsed}ms]`) +
        chalk.dim(`  ${tierNative.results.length} result(s)\n`)
    );
    printResults(tierNative.results, query, chalk);
    console.log("");
    return;
  }

  // ── Tier 2: Fallback fs scan ─────────────────────────────────────────────────
  let fallbackRoots = [currentDir];
  if (isGlobal) {
    if (os.platform() === "win32") {
      try {
        const drives = execSync('powershell -NoProfile -Command "Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Root"', { encoding: 'utf8' })
          .split('\n')
          .map(d => d.trim())
          .filter(d => d && fs.existsSync(d));
        if (drives.length > 0) fallbackRoots = drives;
        else fallbackRoots = [os.homedir()];
      } catch {
        fallbackRoots = [os.homedir()];
      }
    } else {
      fallbackRoots = [os.homedir()];
    }
  }
  
  const statusMsg = tierNative.available 
    ? `  ⚠  System index found 0 results. Falling back to directory scan from:`
    : `  ⚠  No system index available. Falling back to directory scan from:`;

  console.log(
    chalk.yellow(statusMsg + "\n") +
      chalk.dim(`     ${fallbackRoots.join(", ")}\n`)
  );

  let fallbackResults = [];
  for (const root of fallbackRoots) {
    fallbackResults = fallbackResults.concat(fsScan(root, query, type));
  }
  const elapsed = Date.now() - start;

  console.log(
    chalk.green("  ✓ Provider: ") +
      chalk.white("fs scan (fallback)") +
      chalk.dim(`  [${elapsed}ms]`) +
      chalk.dim(`  ${fallbackResults.length} result(s)\n`)
  );
  printResults(fallbackResults, query, chalk);
  console.log("");
}

module.exports = find;
