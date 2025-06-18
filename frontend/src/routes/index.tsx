import loadable from '@loadable/component';
import { BrowserRouter, Routes as ReactRouterDomRoutes, Route } from 'react-router-dom';

import BlizzardLoader from '@/components/BlizzardLoader';
import { publicUrls } from '@/config';
import { ObsWidget } from '@/containers/Profile/ObsWidget';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const { page } = publicUrls;
const ActivityScreen = loadable(() => import('@/containers/Activity'), {
  fallback: <BlizzardLoader />,
});
const MetaScreen = loadable(() => import('@/containers/Meta'), {
  fallback: <BlizzardLoader />,
});
const ProfileScreen = loadable(() => import('@/containers/Profile'), {
  fallback: <BlizzardLoader />,
});

const AppRoutes = () => {
  return (
    <BrowserRouter>
    <Header></Header>
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
            <Route path=":name">
              <Route path="obs-widget" element={<ObsWidget />} />
              <Route path="" element={<ProfileScreen />} />
            </Route>
          </Route>
        </Route>

        <Route path={page} element={<ActivityScreen />} />
        <Route path="*" element={<ActivityScreen />} />
      </ReactRouterDomRoutes>
      <Footer></Footer>
    </BrowserRouter>
  );
};

export default AppRoutes;
