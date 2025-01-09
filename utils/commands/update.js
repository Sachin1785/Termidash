const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const inquirer = require("inquirer");
const detectPackageManager = require("../packageManager");

inquirer.prompt = inquirer.createPromptModule(); 

async function readPackageJson() {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    const chalk = await import("chalk");
    console.error(chalk.default.red("Error: package.json not found in the current directory."));
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
}

function getLatestVersion(packageName) {
  try {
    const output = execSync(`npm show ${packageName} version`, { encoding: "utf-8" });
    return output.trim();
  } catch (error) {
    console.error(`Error fetching the latest version for ${packageName}.`);
    return null;
  }
}

function checkForUpdates(dependencies) {
  const updates = [];

  for (const [pkg, currentVersion] of Object.entries(dependencies)) {
    const latestVersion = getLatestVersion(pkg);
    if (latestVersion && latestVersion !== currentVersion.replace("^", "")) {
      updates.push({ pkg, currentVersion, latestVersion });
    }
  }

  return updates;
}

function getInstalledPackages() {
  try {
    const output = execSync("npm ls --json --depth=0", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });
    return JSON.parse(output).dependencies || {};
  } catch (error) {
    console.error("Error fetching installed packages.");
    return {};
  }
}

function checkForExtraPackages(installedPackages, dependencies, devDependencies) {
  const extraPackages = [];

  for (const pkg of Object.keys(installedPackages)) {
    if (!dependencies[pkg] && !devDependencies[pkg]) {
      extraPackages.push(pkg);
    }
  }

  return extraPackages;
}

async function updateDependencies() {
  const chalk = await import("chalk");
  const packageJson = await readPackageJson();
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  const installedPackages = getInstalledPackages();

  const packageManager = detectPackageManager();
  const installCommand = packageManager === "yarn" ? "yarn install" : packageManager === "pnpm" ? "pnpm install" : "npm install";

  const extraPackages = checkForExtraPackages(installedPackages, dependencies, devDependencies);

  if (extraPackages.length > 0) {
    console.log(chalk.default.yellow("\nThe following extra packages are installed and will be removed:"));
    extraPackages.forEach((pkg) => console.log(chalk.default.yellow(`- ${pkg}`)));

    // Remove extra packages
    extraPackages.forEach((pkg) => {
      console.log(chalk.default.yellow(`\nRemoving extra package ${pkg}...`));
      execSync(`${packageManager === "yarn" ? "yarn remove" : packageManager === "pnpm" ? "pnpm remove" : "npm uninstall"} ${pkg}`, { stdio: "ignore" });
      console.log(chalk.default.green(`✅ ${pkg} removed successfully.`));
    });
  }

  console.log(chalk.default.blue(`\nRunning ${installCommand} to ensure all dependencies are installed...`));
  try {
    execSync(installCommand, { stdio: "ignore" });
  } catch (error) {
    console.error(chalk.default.red("Error installing dependencies."));
    return;
  }

  console.log(chalk.default.blue("\nChecking for updates..."));

  const dependencyUpdates = checkForUpdates(dependencies);
  const devDependencyUpdates = checkForUpdates(devDependencies);

  if (dependencyUpdates.length === 0 && devDependencyUpdates.length === 0) {
    console.log(chalk.default.green("✅ All dependencies are up to date."));
    return;
  }

  const updates = [
    ...dependencyUpdates.map((dep) => ({ ...dep, type: "dependencies" })),
    ...devDependencyUpdates.map((dep) => ({ ...dep, type: "devDependencies" })),
  ];

  console.log(chalk.default.yellow("\nThe following updates are available:"));
  updates.forEach(({ pkg, currentVersion, latestVersion }) => {
    console.log(chalk.default.yellow(`- ${pkg}: ${currentVersion} → ${latestVersion}`));
  });

  const { updateChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "updateChoice",
      message: "What would you like to do?",
      choices: [
        { name: "Update all dependencies", value: "update_all" },
        { name: "Update one dependency at a time", value: "update_one" },
        { name: "Do not update anything", value: "update_none" },
      ],
    },
  ]);

  if (updateChoice === "update_all") {
    // Update all dependencies
    updates.forEach(({ pkg, latestVersion, type }) => {
      if (type === "dependencies") {
        dependencies[pkg] = `^${latestVersion}`;
      } else {
        devDependencies[pkg] = `^${latestVersion}`;
      }
    });

    packageJson.dependencies = dependencies;
    packageJson.devDependencies = devDependencies;

    fs.writeFileSync(path.join(process.cwd(), "package.json"), JSON.stringify(packageJson, null, 2));
    console.log(chalk.default.blue(`\nRunning ${installCommand} to apply updates...`));
    execSync(installCommand, { stdio: "ignore" });
    console.log(chalk.default.green("\n✅ All dependencies updated successfully."));
  } 
  
  else if (updateChoice === "update_one") {
    // Update one dependency at a time
    for (const { pkg, currentVersion, latestVersion, type } of updates) {
      const { update } = await inquirer.prompt([
        {
          type: "confirm",
          name: "update",
          message: `Update ${pkg} (${currentVersion} → ${latestVersion})?`,
          default: true,
        },
      ]);

      if (update) {
        if (type === "dependencies") {
          dependencies[pkg] = `^${latestVersion}`;
        } else {
          devDependencies[pkg] = `^${latestVersion}`;
        }

        fs.writeFileSync(path.join(process.cwd(), "package.json"), JSON.stringify(packageJson, null, 2));
        console.log(chalk.default.blue(`\nRunning ${installCommand} to update ${pkg}...`));
        execSync(installCommand, { stdio: "ignore" });
        console.log(chalk.default.green(`✅ ${pkg} updated successfully.\n`));
      }
    }

    console.log(chalk.default.green("\n✅ Selected dependencies updated successfully."));
  } else {
    console.log(chalk.default.yellow("\nNo updates were applied."));
  }
}

function update() {
  updateDependencies();
}

module.exports = update;