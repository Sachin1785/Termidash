const summary = require("./commands/summary");
const gitStatus = require("./commands/gitStatus");
const update = require("./commands/update");
const search = require("./commands/search");
const deleteEmptyDirs = require("./commands/deleteEmptyDirs");
const config = require("./commands/config");
const tree = require("./commands/tree");
const help = require("./commands/help");
const compress = require("./commands/compress");
const { loadConfig } = require("./configUtil");
const inquirer = require("inquirer");

async function executeCommand(command, args) {
  const settings = loadConfig();
  const aliases = settings.aliases || {};

  // Resolve command alias
  command = Object.keys(aliases).find(key => aliases[key] === command) || command;

  switch (command) {
    case "summary":
      summary(process.cwd(), settings);
      break;
    case "git-status":
      gitStatus();
      break;
    case "update":
      update();
      break;
    case "search":
      const searchTerm = args[0];
      if (searchTerm) {
        search(process.cwd(), searchTerm, settings);
      } else {
        console.error("Error: Please provide a search term.");
      }
      break;
    case "delete-empty":
      const deletedAny = deleteEmptyDirs(process.cwd(), settings);
      if (!deletedAny) {
        console.log("No empty directories found.");
      }
      break;
    case "config":
      config();
      break;
    case "tree":
      tree(process.cwd(), settings);
      break;
    case "help":
      if (args.length === 0) {
        await help();
      } else {
        help();
      }
      break;
    case "compress":
      const compressDir = args[0];
      if (compressDir) {
        compress(compressDir, settings);
      } else {
        const { compressDir } = await inquirer.prompt([
          {
            type: "input",
            name: "compressDir",
            message: "Enter the directory to compress:",
            default: process.cwd(),
          },
        ]);
        compress(compressDir, settings);
      }
      break;
    default:
      console.log("Unknown command. Showing help...");
      help();
      break;
  }
}

module.exports = { executeCommand };
