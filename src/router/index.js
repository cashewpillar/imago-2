import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../domains/tables/views/HomeView.vue';
import TableRecordsView from '../domains/records/views/TableRecordsView.vue';
import AfterlightCreateView from '../domains/afterlight/views/AfterlightCreateView.vue';
import AfterlightOverviewView from '../domains/afterlight/views/AfterlightOverviewView.vue';
import AfterlightChartsView from '../domains/afterlight/views/AfterlightChartsView.vue';

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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
    {
      path: '/afterlight',
      redirect: { name: 'afterlight-log' },
    },
    {
      path: '/afterlight/log',
      name: 'afterlight-log',
      component: AfterlightCreateView,
    },
    {
      path: '/afterlight/overview',
      name: 'afterlight-overview',
      component: AfterlightOverviewView,
    },
    {
      path: '/afterlight/charts',
      name: 'afterlight-charts',
      component: AfterlightChartsView,
    },
  ],
});

export default router;
