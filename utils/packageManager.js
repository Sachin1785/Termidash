const fs = require("fs");
const path = require("path");

function detectPackageManager() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
    return "yarn";
  } else if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  } else {
    return "npm";
  }
}

module.exports = detectPackageManager;
