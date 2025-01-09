const fs = require("fs");
const archiver = require("archiver");
const { loadConfig } = require("../configUtil");

async function compress(directory, settings) {
  const chalk = (await import('chalk')).default;
  const output = fs.createWriteStream(`${directory}.zip`);
  const archive = archiver("zip", {
    zlib: { level: 9 }
  });

  output.on("close", () => {
    console.log(chalk.green(`✅ Compressed ${archive.pointer()} total bytes`));
    console.log(chalk.blue(`📦 Archive created: ${directory}.zip`));
  });

  archive.on("error", err => {
    throw err;
  });

  archive.pipe(output);

  archive.glob("**/*", {
    cwd: directory,
    ignore: [
      settings.ignoreNodeModules ? "node_modules/**" : "",
      settings.ignoreGit ? ".git/**" : ""
    ].filter(Boolean)
  });

  archive.finalize();
}

module.exports = compress;
