const fs = require("fs");
const path = require("path");

async function deleteEmptyDirs(directory, settings) {
  const chalk = (await import('chalk')).default;
  let deletedAny = false;

  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let isEmpty = true;

    entries.forEach((entry) => {
      if (settings.ignoreNodeModules && entry.name === "node_modules") {
        isEmpty = false;
        return;
      }
      if (settings.ignoreGit && entry.name === ".git") {
        isEmpty = false;
        return;
      }

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!traverse(fullPath)) {
          isEmpty = false;
        }
      } else {
        isEmpty = false;
      }
    });

    if (isEmpty) {
      fs.rmdirSync(dir);
      deletedAny = true;
      console.log(chalk.red(`🗑️ Deleted empty directory: ${dir}`));
    }

    return isEmpty;
  }

  traverse(directory);
  return deletedAny;
}

module.exports = deleteEmptyDirs;