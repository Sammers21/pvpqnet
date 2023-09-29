import loadable from '@loadable/component';
import { BrowserRouter, Routes as ReactRouterDomRoutes, Route } from 'react-router-dom';

import Loading from '../components/common/Loading';
import { publicUrls } from '../config';

const { page } = publicUrls;
const ActivityScreen = loadable(() => import('../containers/Activity'), {
  fallback: <Loading />,
});
const MetaScreen = loadable(() => import('../containers/Meta'), {
  fallback: <Loading />,
});
const ProfileScreen = loadable(() => import('../containers/Profile'), {
  fallback: <Loading />,
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
