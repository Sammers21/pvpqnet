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
  fallback: <BlizzardLoader />,
});
const MetaScreen = loadable(() => import("@/containers/Meta"), {
  fallback: <BlizzardLoader />,
});
const ProfileScreen = loadable(() => import("@/containers/Profile"), {
  fallback: <BlizzardLoader />,
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
  const location = useLocation();
  const isObsWidget = location.pathname.includes("obs-widget");
  const [isStreamerOnline, setIsStreamerOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const streamerChannel = "isquare1";

  // Check if streamer is online
  useEffect(() => {
    const controller = new AbortController();

    const checkStreamStatus = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Add a timeout option to avoid hanging if the API is slow
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 5000)
        );

        // Make the actual request with abort signal
        const fetchPromise = fetch(
          `https://decapi.me/twitch/uptime/${streamerChannel}`,
          { signal: controller.signal }
        );

        // Race the timeout against the actual fetch
        const response = (await Promise.race([
          fetchPromise,
          timeoutPromise,
        ])) as Response;

        // Check if response is OK (status 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.text();

        // If the response doesn't contain "is offline", streamer is online
        // We also check for empty responses or other unexpected formats
        if (data && typeof data === "string") {
          setIsStreamerOnline(!data.includes(`${streamerChannel} is offline`));
        } else {
          console.warn("Unexpected response format:", data);
          setIsStreamerOnline(false);
        }
      } catch (error) {
        // Ignore AbortError which happens during cleanup
        if (error.name !== "AbortError") {
          console.error("Error checking stream status:", error);
          setHasError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    // Check initially
    checkStreamStatus();
    // Set up interval to check every 3 minutes (180000 ms)
    // Reduced from 5 minutes to be more responsive to stream status changes
    const intervalId = setInterval(checkStreamStatus, 180000);

    return () => {
      clearInterval(intervalId);
      controller.abort(); // Abort any ongoing fetch requests
    };
  }, [streamerChannel]);

  return (
    <>
      <ReactRouterDomRoutes>
        <Route path={"/"} element={<ActivityScreen />} />
        <Route path={"/meta"} element={<MetaScreen />} />

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

      {/* TwitchPlayer in corner only when streamer is online, not on obs-widget page, and not in loading or error state */}
      {/* Temporarily commented out iSquare stream popup
      {!isObsWidget && !isLoading && !hasError && isStreamerOnline && (
        <TwitchCorner channel={streamerChannel} />
      )}
      */}
    </>
  );
};

export default AppRoutes;
