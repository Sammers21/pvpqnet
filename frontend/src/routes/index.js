import React from 'react';
import loadable from '@loadable/component';
import { BrowserRouter, Routes as ReactRouterDomRoutes, Route } from 'react-router-dom';

import Loading from '../components/Loading';

import { publicUrls } from '../config';

const { page } = publicUrls;

const ActivityPage = loadable(() => import('../containers/Activity'), {
  fallback: Loading({
    pastDelay: true,
    error: false,
    timedOut: false,
  }),
});

function Routes() {
  return (
    <BrowserRouter>
      <ReactRouterDomRoutes>
        <Route path={page} element={<ActivityPage />} />
        <Route path="*" element={<ActivityPage />} />
      </ReactRouterDomRoutes>
    </BrowserRouter>
  );
}

export default Routes;
