const fs = require("fs");
const path = require("path");

async function search(directory, searchTerm, settings) {
  const chalk = (await import('chalk')).default;

  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      if (settings.ignoreNodeModules && entry.name === "node_modules") {
        return;
      }
      if (settings.ignoreGit && entry.name === ".git") {
        return;
      }

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else {
        if (entry.name.includes(searchTerm)) {
          console.log(chalk.yellow(`🔍 ${fullPath}`));
        }
      }
    });
  }

  traverse(directory);
}

module.exports = search;