import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  plugins: [vue()],
  base: isGitHubPagesBuild && repoName ? `/${repoName}/` : '/',
});
