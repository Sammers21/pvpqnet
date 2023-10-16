import { createBrowserRouter } from 'react-router-dom';

import Layout from './Layout';

import Activity from '@/containers/Activity';
import Meta from '@/containers/Meta';
import Profile from '@/containers/Profile';

export const router = createBrowserRouter([
  {
    path: '/:region?',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Activity />,
      },
      {
        path: 'activity/:bracket',
        element: <Activity />,
      },
      {
        path: 'ladder/:bracket',
        element: <Activity />,
      },
      {
        path: 'meta',
        element: <Meta />,
      },
      {
        path: ':realm/:name',
        element: <Profile />,
      },
      {
        path: '*',
        element: <Activity />,
      },
    ],
  },
]);
