## 🛡️ Dev Container Reference

### 1. The Security "Cage"
Your setup is designed to prevent malicious packages (or LLM hallucinations) from accessing your Mac.
* **`npm_config_ignore_scripts`**: Blocks automatic execution of malware during `npm install`.
* **Node Modules Volume**: All packages are stored in a virtual "safe" inside Docker. They are **not** on your Mac's hard drive.
* **User Isolation**: You are the `node` user, not `root`, preventing system-level tampering.

### 2. Common Command Fixes

| Problem | Command / Solution | Why? |
| :--- | :--- | :--- |
| **Permission Denied** | `sudo chown -R node:node node_modules` | Fixes "EACCES" when the volume belongs to root. |
| **Vite Loading (15%)** | `npm run dev -- --host` | Tells Vite to listen to connections outside the container. |
| **Clean Packages** | `rm -rf node_modules/*` | You can't delete the folder (it's a mount), only its contents. |
| **Git Identity** | `git config --global user.name "Your Name"` | Container needs to know who you are to commit code. |

### 3. Networking (Vite / Web Apps)
To see your app on your Mac's browser, you **must** use the `--host` flag.
**Updated `package.json` recommendation:**
```json
"scripts": {
  "dev": "vite --host 0.0.0.0"
}
```

### 4. The "Gold Rules" of Management
* **Renaming/Deleting Project:** Always do this from the **Mac (Host)** side. Close VS Code first, rename the folder in Finder, then reopen.
* **Syncing Git:** Your SSH keys stay on your Mac. Use the VS Code **Source Control** tab to push/pull securely.
* **Persistent Data:** Anything outside the project folder (like global tool configs) is wiped when the container is rebuilt unless added to `mounts`.

### 5. Essential `devcontainer.json` Snippets
```json
"mounts": [
    // The Package Shield
    "source=${localWorkspaceFolderBasename}-node_modules,target=${containerWorkspaceFolder}/node_modules,type=volume",
    // The Identity Link
    "source=${localEnv:HOME}/.gitconfig,target=/home/node/.gitconfig,type=bind,readonly"
],
"forwardPorts": [5173]
```

---

**Pro-Tip:** If the container ever feels "glitchy" after a major change, use the Command Palette (`F1`) and run **"Dev Containers: Rebuild Container"**. It’s the "Turn it off and on again" for Docker.

Ready to get back to the actual code?