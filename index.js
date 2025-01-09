#!/usr/bin/env node

const { executeCommand } = require("./utils/commandExecutor");

// Parse CLI arguments
const args = process.argv.slice(2);
const command = args[0];
const commandArgs = args.slice(1);

// Execute the command
executeCommand(command, commandArgs);
