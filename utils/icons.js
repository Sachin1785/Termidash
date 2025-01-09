function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const icons = {
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'pdf': '📄',
        'doc': '📄',
        'docx': '📄',
        'xls': '📊',
        'xlsx': '📊',
        'ppt': '📊',
        'pptx': '📊',
        'txt': '📄',
        'zip': '🗜️',
        'rar': '🗜️',
        'mp3': '🎵',
        'wav': '🎵',
        'mp4': '🎬',
        'avi': '🎬',
        'mkv': '🎬',
        'html': '🌐',
        'css': '🎨',
        'jsx': '⚛️',
        'js': '⚛️',
        'ts': '📜',
        'tsx': '⚛️',
        'py': '🐍',
        'ipynb': '📓',
        // ...add more file types and icons as needed
    };
    return icons[extension] || '📄';
}

module.exports = { getFileIcon };