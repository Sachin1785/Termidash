const formatSize = require("../formatSize");

async function generateSummary(dir, settings) {
  const chalk = (await import('chalk')).default;
  let totalFiles = 0;
  let totalDirs = 0;
  let totalSize = 0;

  function traverse(directory) {
    const entries = require("fs").readdirSync(directory, { withFileTypes: true });
    entries.forEach((entry) => {
      if (settings.ignoreNodeModules && entry.name === "node_modules") {
        return;
      }
      if (settings.ignoreGit && entry.name === ".git") {
        return;
      }

      const fullPath = require("path").join(directory, entry.name);
      if (entry.isDirectory()) {
        totalDirs++;
        traverse(fullPath);
      } else {
        totalFiles++;
        totalSize += require("fs").statSync(fullPath).size;
      }
    });
  }

  traverse(dir);

  console.log(chalk.blue("\n📁 Directory Summary:"));
  console.log(chalk.green(`📂 Total Directories: ${totalDirs}`));
  console.log(chalk.green(`📄 Total Files: ${totalFiles}`));
  console.log(chalk.green(`📦 Total Size: ${formatSize(totalSize)}`));
}

async function summary(dir, settings) {
  await generateSummary(dir, settings);
}

module.exports = summary;