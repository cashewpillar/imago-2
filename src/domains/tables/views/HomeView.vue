<script setup>
import { RouterLink } from 'vue-router';

const items = [
  {
    label: 'tablevault',
    meta: 'tables and records',
    to: { name: 'tablevault-home' },
  },
  {
    label: 'afterlight',
    meta: 'track',
    to: { name: 'afterlight-log' },
  },
  {
    label: 'commonplace',
    meta: 'library and moments',
    to: { name: 'commonplace' },
  },
];
</script>

<template>
  <div class="launcher-screen">
    <main class="launcher-main">
      <h1>imago-2</h1>
      <ul>
        <li v-for="item in items" :key="item.label">
          <RouterLink :to="item.to">
            <span>{{ item.label }}</span>
            <span class="meta">{{ item.meta }}</span>
          </RouterLink>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.launcher-screen {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: #f7f6f2;
}

.launcher-main {
  width: 100%;
  max-width: 400px;
}

h1 {
  font-size: 1.5rem;
  font-weight: 500;
  margin-bottom: 2rem;
  letter-spacing: -0.02em;
  color: #1a1a18;
}

ul {
  list-style: none;
  padding: 0;
}

li + li {
  margin-top: 0.75rem;
}

a {
  display: block;
  padding: 1rem 1.25rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.09);
  border-radius: 12px;
  text-decoration: none;
  color: #1a1a18;
  transition: transform 0.1s ease, border-color 0.1s ease;
}

a:hover {
  border-color: #1a1a18;
  transform: translateY(-1px);
}

.meta {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #6b6b67;
}

@media (prefers-color-scheme: dark) {
  .launcher-screen {
    background: #1a1a18;
  }

  h1 {
    color: #f0efe9;
  }

  a {
    background: #232321;
    border-color: rgba(255, 255, 255, 0.07);
    color: #f0efe9;
  }

  a:hover {
    border-color: #f0efe9;
  }

  .meta {
    color: #a0a09b;
  }
}
</style>
