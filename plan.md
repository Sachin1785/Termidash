# Termidash Feature Plan: Instant Dependency Discovery (IDD)

## 1. Overview
The **Instant Dependency Discovery (IDD)** feature aims to revolutionize how Termidash interacts with the file system. Instead of the traditional, slow recursive directory traversal (which can take minutes on large drives), IDD leverages pre-existing system indexes to locate "heavy" dependency folders like `node_modules`, `.venv`, and `.next` in milliseconds.

## 2. The Problem
Current file-searching utilities in Node.js often rely on `fs.readdir` or `glob` patterns. On modern development machines with hundreds of projects, a full-disk scan to find folders to clean or analyze results in:
- **High CPU/Disk I/O:** Slowing down the entire system.
- **Poor UX:** Users have to wait for a "crawling" progress bar.
- **Redundancy:** The Operating System (or third-party tools like *Everything*) has already indexed these files; searching again is a waste of resources.

## 3. Proposed Solution
Implement a **Multi-Tiered Indexing Provider** that prioritizes the fastest available search engine on the host machine.

### The Hierarchy of Speed:
1.  **Tier 1: Everything (voidtools) [Windows]** - Direct MFT (Master File Table) access.
2.  **Tier 2: OS-Native Indexing** - `mdfind` (macOS), `locate/plocate` (Linux), `Windows Search` (Windows).


## 4. Feature Requirements
- **Zero-Wait Search:** Results for common folder names should return in < 500ms.
- **Smart Filtering:** Automatically exclude system directories (Windows/System32, /Library, etc.) to prevent accidental deletions.
- **Global Accessibility:** Accessible via a new command: `termidash locate <folder_name>`.
- **Cleanup Integration:** Update the existing cleanup utility to use IDD for near-instant "search and destroy" operations.