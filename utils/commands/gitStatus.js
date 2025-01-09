const { execSync } = require("child_process");
const { writeFileSync } = require("fs");
const path = require("path");
const inquirer = require("inquirer");

// function parseDiff(diffOutput) {
//   const changes = [];
//   const lines = diffOutput.split("\n");

//   let currentFile = null;

//   lines.forEach((line) => {
//     if (line.startsWith("diff --git")) {
//       // Extract file name
//       const match = line.match(/a\/(.+?) /);
//       if (match) currentFile = match[1];
//     } else if (line.startsWith("@@")) {
//       // Extract line change information
//       const match = line.match(/@@ \-(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
//       if (match && currentFile) {
//         const [, , , addedLineStart, addedLineCount] = match;
//         changes.push({
//           file: currentFile,
//           addedLines: Number(addedLineStart),
//           addedCount: Number(addedLineCount || 0),
//         });
//       }
//     } else if (line.startsWith("+") && !line.startsWith("+++")) {
//       // Collect added lines
//       const trimmedLine = line.substring(1).trim();
//       if (changes.length > 0) {
//         const lastChange = changes[changes.length - 1];
//         if (!lastChange.lines) lastChange.lines = [];
//         lastChange.lines.push(trimmedLine);
//       }
//     }
//   });

//   return changes;
// }

async function gitStatus() {
  try {
    const chalk = await import("chalk");
    const result = execSync("git status --short", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });
    if (!result.trim()) {
      console.log(chalk.default.green("\n✅ No changes detected in the working tree."));
    } else {
      console.log(chalk.default.cyan("\n📄 Git Status (Untracked/Modified Files):"));
      const lines = result.trim().split("\n");
      const files = lines.map(line => {
        line = line.trim();
        if (line.startsWith("?? ")) {
          return line.slice(3).trim();
        } else {
          return line.slice(2).trim();
        }
      });

      lines.forEach(line => {
        line = line.trim();
        if (line.startsWith("M ")) {
          console.log(chalk.default.blue("📝 M") + line.slice(1));
        } else if (line.startsWith("?? ")) {
          console.log(chalk.default.yellow("❓ U") + line.slice(2));
        } else {
          console.log(line);
        }
      });

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'commit',
          message: 'Do you want to commit the changes? 💾',
          default: false
        },
        {
          type: 'checkbox',
          name: 'files',
          message: 'Select files to commit: 📂',
          choices: files,
          when: (answers) => answers.commit
        },
        {
          type: 'input',
          name: 'message',
          message: 'Enter commit message: 📝',
          when: (answers) => answers.commit && answers.files.length > 0
        }
      ]);

      if (answers.commit) {
        if (answers.files.length === 0) {
          console.log(chalk.default.red("❌ No files selected. Nothing to commit."));
        } else {
          console.log(chalk.default.green(`✅ Commit message: ${answers.message}`));

         // const filePath = "testing.txt";
        // writeFileSync(filePath, answers.files.join('\n'));

        // const diffOutput = execSync("git diff --unified=0", { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] });
        // const parsedDiff = parseDiff(diffOutput);
        // writeFileSync("git.txt", JSON.stringify(parsedDiff, null, 2));

        // console.log(`Selected files saved to: ${filePath}`);
        console.log(chalk.default.green(`Commit message: ${answers.message}`));

          // Add and commit the selected files
          execSync(`git add ${answers.files.join(' ')}`);
          execSync(`git commit -m "${answers.message}"`);
          execSync("git push");
        }
      }
    }
  } catch (err) {
     const chalk = await import("chalk");
    console.error(chalk.default.red("❌ Error: Not a Git repository or Git is not installed."));
  }
}

module.exports = gitStatus;