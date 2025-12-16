import { useMemo, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { generatePath } from "react-router";
import { createBreakpoint } from "react-use";

import { AppBar, Toolbar } from "@mui/material";
import { styled } from "@mui/system";
import MobileView from "./MobileView";
import DesktopView from "./DesktopView";


import { borderColor, containerBg } from "@/theme";
import {
  cutoffsUrls,
  metaUrls,
  publicUrls,
  shuffleMulticlassUrls,
} from "@/config";
import { REGION } from "@/constants/region";
import { BRACKETS } from "@/constants/pvp-activity";
import { getActivityFromUrl, getBracket, getRegion } from "@/utils/urlparts";

const StyledAppBar = styled(AppBar)({
  backgroundImage: "none",
  backgroundColor: `${containerBg} !important`,
  boxShadow: "0 0 #0000,0 0 #0000,0px 0px 15px 0 rgba(0, 0, 0, 1)",
  borderColor: borderColor,
});

const StyledToolbar = styled(Toolbar)({
  minHeight: "48px !important",
});

const useBreakpoint = createBreakpoint({
  mobile: 0,
  tablet: 768,
  desktop: 1280,
});

const Header = () => {
  let navigate = useNavigate();
  const location = useLocation();
  const host = window.location.host.toUpperCase();
  const { region: regionFromUrl, bracket = getBracket() } = useParams();
  const region = getRegion(regionFromUrl);
  const activity = getActivityFromUrl();
  const breakpoint = useBreakpoint();
  const [battleTag, setBattleTag] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem("pvpqnet_battletag");
    } catch (e) {
      return null;
    }
  });
  const [isMeLoading, setIsMeLoading] = useState(true);

  useEffect(() => {
    setIsMeLoading(true);
    fetch("/api/me")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (data && data.battletag) {
          setBattleTag(data.battletag);
          try {
            window.localStorage.setItem("pvpqnet_battletag", data.battletag);
          } catch (e) {}
        } else {
          setBattleTag(null);
          try {
            window.localStorage.removeItem("pvpqnet_battletag");
          } catch (e) {}
        }
      })
      .catch((err) => console.error("Error fetching user info", err))
      .finally(() => setIsMeLoading(false));
  }, []);

  const isMeta = useMemo(() => {
    return location.pathname.includes("meta");
  }, [location]);

  const isShuffleMclass = useMemo(() => {
    return location.pathname.includes("shuffle-multiclass");
  }, [location]);
  const isCutoffs = useMemo(() => {
    return location.pathname.includes("cutoffs");
  }, [location]);

  function handleSetRegion(rg: REGION) {
    let newPath;
    if (isMeta) {
      newPath = generatePath(metaUrls.page, { region: rg });
    } else if (isShuffleMclass) {
      newPath = generatePath(shuffleMulticlassUrls.page, { region: rg });
    } else if (isCutoffs) {
      newPath = generatePath(cutoffsUrls.page, { region: rg });
    } else {
      newPath = generatePath(publicUrls.page, {
        region: rg,
        activity,
        bracket,
      });
    }
    navigate(newPath + window.location.search);
  }

  const activityHref =
    generatePath(publicUrls.page, {
      region,
      activity: "activity",
      bracket: isMeta || isShuffleMclass ? BRACKETS.shuffle : bracket,
    }) + location.search;
  const ladderHref =
    generatePath(publicUrls.page, {
      region,
      activity: "ladder",
      bracket: isMeta || isShuffleMclass ? BRACKETS.shuffle : bracket,
    }) + location.search;
  const multiclassHref = generatePath(publicUrls.page, {
    region,
    activity: "ladder",
    bracket: "shuffle-multiclass",
  });
  const metaHref = "/" + region + "/meta";
  const cutoffsHref = "/" + region + "/cutoffs";

  const menuItems: {
    label: string;
    href: string;
    external?: boolean;
    isSpecial?: boolean;
    badge?: string;
  }[] = [
    {
      label: "AI",
      href: "https://ai.pvpq.net",
      external: true,
      isSpecial: true,
    },
    { label: "Activity", href: activityHref },
    { label: "Leaderboards", href: ladderHref },
    { label: "Multiclassers", href: multiclassHref },
    { label: "Cutoffs", href: cutoffsHref },
    { label: "Meta", href: metaHref },
    {
      label: "Widget",
      href: "https://github.com/Sammers21/pvpqnet/wiki/Obs-Widget",
      external: true,
    },
  ];

  const isMobile = breakpoint === "mobile" || breakpoint === "tablet";
  const View = isMobile ? MobileView : DesktopView;
  return (
    <StyledAppBar position="fixed">

      <StyledToolbar disableGutters>
        <View
          region={region}
          setRegion={handleSetRegion}
          menuItems={menuItems}
          host={host}
          battleTag={battleTag}
          isMeLoading={isMeLoading}
        />
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header;
