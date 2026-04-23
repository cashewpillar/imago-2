import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../domains/home/views/HomeView.vue';
import StoryView from '../domains/story/views/StoryView.vue';
import DayView from '../domains/day/views/DayView.vue';
import FillingUpView from '../domains/filling-up/views/FillingUpView.vue';
import TableVaultView from '../domains/table-vault/views/TableVaultView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/story', name: 'story', component: StoryView },
  { path: '/day', name: 'day', component: DayView },
  { path: '/filling-up', name: 'filling-up', component: FillingUpView },
  { path: '/tablevault', name: 'tablevault', component: TableVaultView },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
