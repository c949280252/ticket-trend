import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import AdminLogin from '../views/AdminLogin.vue'
import AdminLottery from '../views/AdminLottery.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: Detail
  },
  {
    path: '/trend/:id',
    name: 'Trend',
    component: Detail
  },
  {
    path: '/x7k9m2',
    name: 'AdminLogin',
    component: AdminLogin
  },
  {
    path: '/x7k9m2/lottery',
    name: 'AdminLottery',
    component: AdminLottery
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router