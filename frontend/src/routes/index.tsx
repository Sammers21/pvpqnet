import React from 'react';
import loadable from '@loadable/component';
import { BrowserRouter, Routes as ReactRouterDomRoutes, Route } from 'react-router-dom';

import Loading from '../components/Loading';
import { publicUrls } from '../config';

const { page } = publicUrls;
const ActivityScreen = loadable(() => import('../containers/Activity'), {
  fallback: Loading({ pastDelay: true, error: false, timedOut: false }),
});
const MetaScreen = loadable(() => import('../components/Meta'), {
  fallback: Loading({ pastDelay: true, error: false, timedOut: false }),
});
const ProfileScreen = loadable(() => import('../components/Profile'), {
  fallback: Loading({ pastDelay: true, error: false, timedOut: false }),
});

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ReactRouterDomRoutes>
        <Route path={'/'} element={<ActivityScreen />} />
        <Route path={'/meta'} element={<MetaScreen />} />

        <Route path=":region">
          <Route path="meta" element={<MetaScreen />} />
          <Route path="activity" element={<ActivityScreen />}>
            <Route path=":bracket" element={<ActivityScreen />} />
          </Route>
          <Route path="ladder" element={<ActivityScreen />}>
            <Route path=":bracket" element={<ActivityScreen />} />
          </Route>
          <Route path=":realm">
            <Route path=":name" element={<ProfileScreen />} />
          </Route>
        </Route>

        <Route path={page} element={<ActivityScreen />} />
        <Route path="*" element={<ActivityScreen />} />
      </ReactRouterDomRoutes>
    </BrowserRouter>
  );
};

export default AppRoutes;
