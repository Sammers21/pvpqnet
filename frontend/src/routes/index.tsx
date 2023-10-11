import loadable from '@loadable/component';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './Layout';
import Loading from '@/components/common/Loading';
import { publicUrls } from '@/config';

const { page } = publicUrls;

const ActivityScreen = loadable(() => import('@/containers/Activity'), {
  fallback: <Loading />,
});
const MetaScreen = loadable(() => import('@/containers/Meta'), {
  fallback: <Loading />,
});
const ProfileScreen = loadable(() => import('@/containers/Profile'), {
  fallback: <Loading />,
});

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ActivityScreen />} />
          <Route path="meta" element={<MetaScreen />} />

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
