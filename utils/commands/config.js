const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const { loadConfig, saveConfig } = require("../configUtil");

inquirer.prompt = inquirer.createPromptModule(); 

async function modifyConfig() {
  const config = loadConfig();
  const questions = Object.keys(config).flatMap((key) => {
    if (key === "aliases") {
      return Object.entries(config[key]).map(([command, alias]) => ({
        type: "input",
        name: `${key}.${command}`,
        message: `Set alias for command '${command}':`,
        default: alias,
      }));
    } else {
      return {
        type: typeof config[key] === "boolean" ? "confirm" : "input",
        name: key,
        message: `Set value for ${key}:`,
        default: config[key],
      };
    }
  });

  const answers = await inquirer.prompt(questions);
  const updatedConfig = Object.keys(answers).reduce((acc, key) => {
    const [mainKey, subKey] = key.split(".");
    if (subKey) {
      acc[mainKey] = acc[mainKey] || {};
      acc[mainKey][subKey] = answers[key];
    } else {
      acc[key] = answers[key];
    }
    return acc;
  }, config);

  saveConfig(updatedConfig);
  console.log("Configuration updated successfully.");
}

function config() {
  modifyConfig();
}

module.exports = config;