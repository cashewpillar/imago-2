# GitHub Pages During The Vue Migration

GitHub Pages will publish whatever `npm run build` writes to `dist/` from `main`.

To keep deploys stable while the HTML and JS app is being migrated to Vue:

1. Keep a working Vite entrypoint on `main`.
   - `index.html` must exist at the repo root.
   - `src/main.js` must exist and mount the Vue app.

2. Treat `npm run build` as the merge gate for deployment.
   - If the migration branch removes or renames the entry files, replace them in the same branch before merging.
   - Do not merge partial filesystem moves to `main` if the build no longer has an app entry.

3. Move legacy screens behind the Vue shell instead of deleting them all at once.
   - Migrate one route or feature at a time.
   - If a page still needs the old implementation, keep it reachable from the Vue app until its replacement is ready.

4. GitHub Pages base paths are handled in `vite.config.js`.
   - Local development stays on `/`.
   - GitHub Actions builds use `/<repo-name>/`, which matches project Pages hosting.

Once the Vue migration is complete, the same workflow can stay in place unchanged.
