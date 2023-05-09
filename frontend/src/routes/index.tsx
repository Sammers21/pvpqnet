import loadable from '@loadable/component';
import { BrowserRouter, Routes as ReactRouterDomRoutes, Route } from 'react-router-dom';

import Loading from '../components/common/Loading';

import { publicUrls } from '../config';

const ActivityPage = loadable(() => import('../containers/Activity'), {
  fallback: <Loading />,
});

function Routes() {
  return (
    <BrowserRouter>
      <ReactRouterDomRoutes>
        <Route path={publicUrls.activity} element={<ActivityPage />} />

        <Route path="*" element={<ActivityPage />} />
      </ReactRouterDomRoutes>
    </BrowserRouter>
  );
}

export default Routes;
