import React from 'react';
import loadable from '@loadable/component';
import {BrowserRouter, Routes as ReactRouterDomRoutes, Route, Routes} from 'react-router-dom';

import Loading from '../components/Loading';

import { publicUrls } from '../config';
import Profile from "../components/Profile";
import Meta from "../components/Meta";

const { page } = publicUrls;

const ActivityPage = loadable(() => import('../containers/Activity'), {
  fallback: Loading({
    pastDelay: true,
    error: false,
    timedOut: false,
  }),
});

function AppRoutes() {
  return (
    <BrowserRouter>
      <ReactRouterDomRoutes>
        <Route path={"/"} element={<ActivityPage/>}/>
        <Route path={"/meta"} element={<Meta/>}/>
        <Route path=":region">
            <Route path="meta" element={<Meta/>}/>
            <Route path="activity" element={<ActivityPage/>}>
              <Route path=":bracket" element={<ActivityPage/>}/>
            </Route>
          <Route path="ladder" element={<ActivityPage/>}>
            <Route path=":bracket" element={<ActivityPage/>}/>
          </Route>
            <Route path=":realm">
              <Route path=":name" element={<Profile/>}/>
            </Route>
        </Route>
        <Route path={page} element={<ActivityPage/>}/>
        <Route path="*" element={<ActivityPage/>}/>
      </ReactRouterDomRoutes>
    </BrowserRouter>
  );
}

export default AppRoutes;
