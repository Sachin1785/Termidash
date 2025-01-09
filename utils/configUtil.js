const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const summary = require("./commands/summary");
const configFilePath = path.join(process.cwd(), "config.json");

function loadConfig() {
  if (!fs.existsSync(configFilePath)) {
    // Default configurations if nothing exists for some reason
    return {
      ignoreNodeModules: true,
      ignoreGit: true,
      showSize: false,
      aliases: {
        "tree": "t",
        "summary": "s",
        "git-status": "gs",
        "update": "up",
        "search": "sr",
        "delete-empty": "dl",
        "config": "c",
        "help": "h",
        "compress": "cmp"
      }
    };
  }
  return JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
}

function saveConfig(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

module.exports = { loadConfig, saveConfig };
