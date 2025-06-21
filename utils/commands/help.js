const inquirer = require("inquirer");
const summary = require("./summary");
const update = require("./update");
const search = require("./search");
const deleteEmptyDirs = require("./deleteEmptyDirs");
const config = require("./config");
const tree = require("./tree");
const { loadConfig } = require("../configUtil");
const compress = require("./compress");

async function help() {
  const settings = loadConfig();

  const { selectedCommand } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedCommand",
      message: "Select a command to execute:",      choices: [
        { name: "Tree", value: "tree" },
        { name: "Summary", value: "summary" },
        { name: "Update", value: "update" },
        { name: "Search", value: "search" },
        { name: "Delete Empty Dirs", value: "delete-empty" },
        { name: "Config", value: "config" },
        { name: "Compress", value: "compress" },
        { name: "Exit", value: "exit" },
      ],
      loop: false, 
    },
  ]);

  switch (selectedCommand) {    case "summary":
      summary(process.cwd(), settings);
      break;
    case "update":
      update();
      break;
    case "search":
      const { searchTerm } = await inquirer.prompt([
        {
          type: "input",
          name: "searchTerm",
          message: "Enter search term:",
        },
      ]);
      if (searchTerm) {
        search(process.cwd(), searchTerm, settings);
      } else {
        console.error("Error: No search term provided.");
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
    case "compress":
      const { compressDir } = await inquirer.prompt([
        {
          type: "input",
          name: "compressDir",
          message: "Enter the directory to compress:",
          default: process.cwd(),
        },
      ]);
      compress(compressDir, settings);
      break;
    case "exit":
      console.log("Exiting...");
      process.exit(0);
      break;
    default:
      console.error("Unknown command.");
      break;
  }
}

module.exports = help;
