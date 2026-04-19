# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2026-04-19

### Changed

*   **Portable tag storage** — tags are now stored using paths relative to the workspace root instead of absolute URIs. Moving or renaming the workspace folder no longer breaks existing tags. Existing tag databases with absolute-URI keys are migrated automatically on first load.

---

## [0.0.3] - 2026-04-19

### Changed

*   **Tag autocomplete** — "Tag the current file" now uses a multi-select quick pick instead of a plain text input. Existing workspace tags are shown as selectable options with fuzzy matching as you type. New tags can be added by typing a name that doesn't exist yet.

---

## [0.0.2] - 2026-04-18

This release is from the [wyldphyre fork](https://github.com/Udayk02/tagitup) of the original TagitUp extension.

### Added

*   **File-based tag storage** — tags are now persisted to `.vscode/tagitup.json` in the workspace folder instead of VS Code's internal `workspaceState`. Tags travel with the project and can be committed to source control.

### Fixed

*   Files with spaces in their names now display correctly in the tag panel instead of showing percent-encoded characters (e.g. `my file.ts` instead of `my%20file.ts`).
*   Files listed under a tag in the panel are now sorted alphabetically by filename.

---

## [0.0.1] - 2025-04-06

### Added

*   Initial release of TagitUp.
*   Bunch of features:
    * Tagging a file
    * Removing a tag
    * Searching by tag expression like #tag1 & #tag2 or (#tag1 | #tag2) & #tag3
    * Renaming and deletion of files within the VS Code does immediate to changes to tags as well along with the file.
* Other commands like refreshing and clearing the entire workspace state to remove all the tags.