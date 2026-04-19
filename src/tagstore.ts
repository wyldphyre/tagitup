import * as vscode from 'vscode';

const STORE_RELATIVE_PATH = '.vscode/tagitup.json';

/**
 * File-based tag storage. Persists tag data to .vscode/tagitup.json inside
 * the workspace folder instead of VS Code's internal workspaceState, so the
 * tag database travels with the project (e.g. can be committed to source control).
 *
 * Implements vscode.Memento so it can be used as a drop-in replacement anywhere
 * the extension previously passed `context.workspaceState`.
 */
export class FileTagStore implements vscode.Memento {
    private data: Record<string, string[]> = {};
    private readonly storeUri: vscode.Uri | undefined;

    constructor() {
        const folders = vscode.workspace.workspaceFolders;
        if (folders && folders.length > 0) {
            this.storeUri = vscode.Uri.joinPath(folders[0].uri, STORE_RELATIVE_PATH);
        }
    }

    /**
     * Load tag data from disk. Must be called once during extension activation
     * before any reads or writes are attempted.
     */
    async load(): Promise<void> {
        if (!this.storeUri) {
            return;
        }
        try {
            const bytes = await vscode.workspace.fs.readFile(this.storeUri);
            const text = new TextDecoder().decode(bytes);
            const parsed = JSON.parse(text);
            // Guard against corrupt / unexpected file shapes
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                this.data = parsed as Record<string, string[]>;
            }
        } catch {
            // File does not exist yet, or is unreadable — start with an empty store.
            this.data = {};
        }

        // Migrate any legacy absolute-URI keys to relative paths.
        const migrated: Record<string, string[]> = {};
        let needsMigration = false;
        for (const [key, value] of Object.entries(this.data)) {
            if (key.includes('://')) {
                needsMigration = true;
                migrated[this.toRelativeKey(key)] = value;
            } else {
                migrated[key] = value;
            }
        }
        if (needsMigration) {
            this.data = migrated;
            await this.persist();
        }
    }

    // ── vscode.Memento interface ─────────────────────────────────────────────

    // Keys are stored internally as relative paths but exposed as absolute URI
    // strings so callers don't need to change.
    keys(): readonly string[] {
        return Object.keys(this.data).map(rel => this.toAbsoluteUri(rel));
    }

    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultValue: T): T;
    get<T>(key: string, defaultValue?: T): T | undefined {
        const value = this.data[this.toRelativeKey(key)] as unknown as T | undefined;
        return value !== undefined ? value : defaultValue;
    }

    async update(key: string, value: any): Promise<void> {
        const rel = this.toRelativeKey(key);
        if (value === undefined || value === null) {
            delete this.data[rel];
        } else {
            this.data[rel] = value;
        }
        await this.persist();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private toRelativeKey(absUriString: string): string {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) { return absUriString; }
        try {
            const fileUri = vscode.Uri.parse(absUriString);
            const workspaceUri = folders[0].uri;
            if (fileUri.scheme === workspaceUri.scheme &&
                fileUri.path.startsWith(workspaceUri.path + '/')) {
                return fileUri.path.slice(workspaceUri.path.length + 1);
            }
        } catch { /* fall through */ }
        return absUriString;
    }

    private toAbsoluteUri(key: string): string {
        if (key.includes('://')) { return key; } // already an absolute URI
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) { return key; }
        return vscode.Uri.joinPath(folders[0].uri, key).toString();
    }

    private async persist(): Promise<void> {
        if (!this.storeUri) {
            vscode.window.showWarningMessage(
                'TagitUp: No workspace folder is open — tags cannot be saved to a file.'
            );
            return;
        }
        try {
            // Ensure .vscode/ directory exists before writing
            const vscodeDirUri = vscode.Uri.joinPath(this.storeUri, '..');
            await vscode.workspace.fs.createDirectory(vscodeDirUri);

            const text = JSON.stringify(this.data, null, 2);
            await vscode.workspace.fs.writeFile(
                this.storeUri,
                new TextEncoder().encode(text)
            );
        } catch (err: any) {
            vscode.window.showErrorMessage(
                `TagitUp: Failed to save tags — ${err?.message ?? String(err)}`
            );
        }
    }
}
