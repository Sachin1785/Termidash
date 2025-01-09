function formatSize(size) {
  if (size < 1024) 
    return `${size} B`;
  else if (size < 1024 * 1024) 
    return `${(size / 1024).toFixed(4)} KB`;
  else if (size < 1024 * 1024 * 1024) 
    return `${(size / (1024 * 1024)).toFixed(4)} MB`;
  else
    return `${(size / (1024 * 1024 * 1024)).toFixed(4)} GB`;
}

module.exports = formatSize;
