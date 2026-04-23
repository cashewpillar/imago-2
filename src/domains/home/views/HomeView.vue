<template>
  <main class="home">
    <h1 class="home__title">imago</h1>
    <ul class="home__list">
      <li v-for="app in apps" :key="app.slug">
        <RouterLink :to="app.route" class="home__link">
          <span>{{ app.title }}</span>
          <span class="home__meta">{{ app.meta }}</span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { imagoApps as apps } from '../data/apps';
</script>

<style scoped>
.home {
  width: 100%;
  max-width: 400px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.home__title {
  margin: 0 0 2rem;
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.home__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.home__list li + li {
  margin-top: 0.75rem;
}

.home__link {
  display: block;
  padding: 1rem 1.25rem;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.09);
  border-radius: 12px;
  text-decoration: none;
  color: #1a1a18;
  transition: transform 0.1s ease, border-color 0.1s ease;
}

.home__link:hover {
  border-color: #1a1a18;
  transform: translateY(-1px);
}

.home__meta {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #6b6b67;
}
</style>
