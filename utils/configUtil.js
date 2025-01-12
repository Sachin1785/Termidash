const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.termidash');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

const defaultConfig = {
  ignoreNodeModules: true,
  ignoreGit: true,
  showSize: false,
  aliases: {
    "tree": "t",
    "summary": "s",
    // "git-status": "gs",
    "update": "up",
    "search": "sr",
    "delete-empty": "dl",
    "config": "c",
    "help": "h",
    "compress": "cmp"
  }
};

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    saveConfig(defaultConfig);
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

module.exports = { loadConfig, saveConfig };
