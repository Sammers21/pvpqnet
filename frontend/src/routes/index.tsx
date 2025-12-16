import loadable from "@loadable/component";
import {
  BrowserRouter,
  Routes as ReactRouterDomRoutes,
  Route,
} from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import BlizzardLoader from "@/components/BlizzardLoader";
import { publicUrls } from "@/config";
import { ObsWidget } from "@/containers/Profile/ObsWidget";
import TwitchCorner from "@/components/TwitchCorner";

const { page } = publicUrls;
const ActivityScreen = loadable(() => import("@/containers/Activity"), {
  fallback: null,
});
const MetaScreen = loadable(() => import("@/containers/Meta"), {
  fallback: null,
});
const ProfileScreen = loadable(() => import("@/containers/Profile"), {
  fallback: null,
});
const CutoffsScreen = loadable(() => import("@/containers/Cutoffs"), {
  fallback: null,
});
const CabinetScreen = loadable(() => import("@/containers/Cabinet"), {
  fallback: null,
});

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

// Separate component to use hooks
const AppContent = () => {
  return (
    <>
      <ReactRouterDomRoutes>
        <Route path={"/"} element={<ActivityScreen />} />
        <Route path={"/cabinet"} element={<CabinetScreen />} />
        <Route path={"/cutoffs"} element={<CutoffsScreen />} />
        <Route path={"/meta"} element={<MetaScreen />} />

        <Route path=":region">
          <Route path="cutoffs" element={<CutoffsScreen />} />
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
    </>
  );
};

export default AppRoutes;
