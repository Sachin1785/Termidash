const fs = require("fs");
const path = require("path");
const formatSize = require("../formatSize"); 
const { loadConfig } = require("../configUtil"); 
const {getFileIcon} = require("../icons");

function printWorkingTree(dir, prefix = "", settings) {
  const folderIcon = "📁"; 

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";

    if (settings.ignoreNodeModules && entry.name === "node_modules") {
      console.log(`${prefix}${connector}📁node_modules`);
      return;
    }

    if (settings.ignoreGit && entry.name === ".git") {
      console.log(`${prefix}${connector}📁.git`);
      return;
    }


    const fullPath = path.join(dir, entry.name);

    let size = "";
    if (settings.showSize && !entry.isDirectory()) {
      size = ` (${formatSize(fs.statSync(fullPath).size)})`;
    }

    // const entryName = entry.isDirectory() ? `${folderIcon} ${entry.name}` : `${getFileIcon(entry.name)} ${entry.name}`;
    const entryName = entry.isDirectory() ? `${folderIcon} ${entry.name}` : `${entry.name}`;
    
    console.log(`${prefix}${connector}${entryName}${size}`);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      printWorkingTree(fullPath, newPrefix, settings);
    }
  });
}

function tree(dir, settings) {
  const currentDirName = path.basename(dir);
  console.log(`📁 ${currentDirName}`);
  printWorkingTree(dir, "", settings);
}

module.exports = tree;

