import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../domains/tables/views/HomeView.vue';
import TableRecordsView from '../domains/records/views/TableRecordsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/tables/:tableId',
      name: 'table-records',
      component: TableRecordsView,
      props: true,
    },
  ],
});

export default router;
