import express from 'express';
import CategoryRoutes from '../modules/category/category.route';
import ContactRoutes from '../modules/contact/contact.route';
import EventRoutes from '../modules/event/event.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/contact',
    route: ContactRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/events',
    route: EventRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
