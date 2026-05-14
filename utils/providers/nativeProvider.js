const { execSync } = require("child_process");
const os = require("os");

// Directories that should never appear in results to prevent accidental operations
const SYSTEM_BLACKLIST = [
  // Windows
  /^[A-Za-z]:\\Windows\\/i,
  /^[A-Za-z]:\\Program Files/i,
  /^[A-Za-z]:\\ProgramData/i,
  // macOS
  /^\/System\//,
  /^\/Library\//,
  /^\/private\//,
  /^\/usr\//,
  /^\/bin\//,
  /^\/sbin\//,
  // Linux
  /^\/proc\//,
  /^\/sys\//,
  /^\/dev\//,
  /^\/run\//,
  /^\/boot\//,
];

/**
 * Filter out system-protected paths.
 * @param {string[]} paths
 * @returns {string[]}
 */
function filterSystemPaths(paths) {
  return paths.filter((p) => !SYSTEM_BLACKLIST.some((rx) => rx.test(p)));
}

/**
 * Tier 2a: Windows Search via PowerShell / WMI.
 *
 * @param {string} query
 * @param {"file"|"folder"|"all"} type
 * @param {string} rootDir
 * @param {boolean} isGlobal
 * @returns {{ results: string[], available: boolean }}
 */
function queryWindowsSearch(query, type, rootDir, isGlobal) {
  try {
    let scope = "";
    if (type === "folder") scope = "AND System.Kind = 'folder'";
    else if (type === "file") scope = "AND System.Kind = 'document'";

    if (!isGlobal) {
      scope += ` AND SCOPE='file:${rootDir.replace(/\\/g, "/")}'`;
    }

    const ps = [
      `$con = New-Object -ComObject ADODB.Connection`,
      `$con.Open('Provider=Search.CollatorDSO;Extended Properties=''Application=Windows'';')`,
      `$rs = New-Object -ComObject ADODB.Recordset`,
      `$rs.Open('SELECT System.ItemPathDisplay FROM SYSTEMINDEX WHERE System.FileName LIKE ''%${query}%'' ${scope}', $con)`,
      `while(-not $rs.EOF){ $rs.Fields.Item('System.ItemPathDisplay').Value; $rs.MoveNext() }`,
      `$rs.Close(); $con.Close()`,
    ].join("; ");

    const raw = execSync(`powershell -NoProfile -NonInteractive -Command -`, {
      encoding: "utf-8",
      input: ps,
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 10000,
    });

    const results = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return { available: true, results: filterSystemPaths(results) };
  } catch {
    return { available: false, results: [] };
  }
}

/**
 * Tier 2b: macOS mdfind (Spotlight).
 *
 * @param {string} query
 * @param {"file"|"folder"|"all"} type
 * @param {string} rootDir
 * @param {boolean} isGlobal
 * @returns {{ results: string[], available: boolean }}
 */
function queryMdfind(query, type, rootDir, isGlobal) {
  try {
    const scopeDir = isGlobal ? "/" : rootDir;
    let kindClause = "";
    if (type === "folder") kindClause = `-onlyin "${scopeDir}" 'kMDItemKind == "Folder" && kMDItemFSName == "*${query}*"c'`;
    else if (type === "file") kindClause = `-onlyin "${scopeDir}" 'kMDItemKind != "Folder" && kMDItemFSName == "*${query}*"c'`;
    else kindClause = `-onlyin "${scopeDir}" -name "${query}"`;

    const raw = execSync(`mdfind ${kindClause}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 8000,
    });

    const results = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return { available: true, results: filterSystemPaths(results) };
  } catch {
    return { available: false, results: [] };
  }
}

/**
 * Tier 2c: Linux locate/plocate.
 *
 * @param {string} query
 * @param {"file"|"folder"|"all"} type
 * @param {string} rootDir
 * @param {boolean} isGlobal
 * @returns {{ results: string[], available: boolean }}
 */
function queryLocate(query, type, rootDir, isGlobal) {
  try {
    // Prefer plocate, fall back to locate
    const bin = (() => {
      try { execSync("plocate --version", { stdio: "ignore" }); return "plocate"; } catch { return "locate"; }
    })();

    const raw = execSync(`${bin} "${query}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
      timeout: 8000,
    });

    let results = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (!isGlobal) {
      results = results.filter((p) => p.startsWith(rootDir));
    }

    // locate can't natively filter by type, so we do it ourselves
    if (type !== "all") {
      const fs = require("fs");
      results = results.filter((p) => {
        try {
          const stat = fs.statSync(p);
          return type === "folder" ? stat.isDirectory() : stat.isFile();
        } catch {
          return false;
        }
      });
    }

    return { available: true, results: filterSystemPaths(results) };
  } catch {
    return { available: false, results: [] };
  }
}

/**
 * Select and run the best available native OS provider.
 *
 * @param {string} query
 * @param {"file"|"folder"|"all"} type
 * @param {string} rootDir
 * @param {boolean} isGlobal
 * @returns {{ results: string[], providerName: string }}
 */
function queryNative(query, type, rootDir, isGlobal) {
  const platform = os.platform();

  if (platform === "win32") {
    const result = queryWindowsSearch(query, type, rootDir, isGlobal);
    if (result.available) return { ...result, providerName: "Windows Search" };
  } else if (platform === "darwin") {
    const result = queryMdfind(query, type, rootDir, isGlobal);
    if (result.available) return { ...result, providerName: "Spotlight (mdfind)" };
  } else {
    const result = queryLocate(query, type, rootDir, isGlobal);
    if (result.available) return { ...result, providerName: "locate" };
  }

  return { available: false, results: [], providerName: "none" };
}

module.exports = { queryNative };
