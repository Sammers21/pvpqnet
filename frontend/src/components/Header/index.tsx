import { useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { generatePath } from "react-router";
import { createBreakpoint } from "react-use";

import { AppBar, Container, Toolbar } from "@mui/material";
import { styled } from "@mui/system";
import MobileView from "./MobileView";
import DesktopView from "./DesktopView";

import { borderColor, containerBg } from "@/theme";
import { metaUrls, publicUrls, shuffleMulticlassUrls } from "@/config";
import { REGION } from "@/constants/region";
import { BRACKETS } from "@/constants/pvp-activity";
import {getActivityFromUrl, getBracket, getRegion} from "@/utils/urlparts";

const StyledAppBar = styled(AppBar)({
  backgroundImage: "none",
  backgroundColor: `${containerBg} !important`,
  boxShadow: "0 0 #0000,0 0 #0000,0px 0px 15px 0 rgba(0, 0, 0, 1)",
  borderColor: borderColor,
});

const StyledToolbar = styled(Toolbar)({
  minHeight: "48px !important",
});

const useBreakpoint = createBreakpoint({ mobile: 0, tablet: 768, desktop: 1280 });

const Header = () => {
  let navigate = useNavigate();
  const location = useLocation();
  const host = window.location.host.toUpperCase();
  const {
    region: regionFromUrl = REGION.eu,
    bracket = getBracket(),
  } = useParams();
  const region = getRegion(regionFromUrl);
  const activity = getActivityFromUrl();
  const breakpoint = useBreakpoint();

  const isMeta = useMemo(() => {
    return location.pathname.includes("meta");
  }, [location]);

  const isShuffleMclass = useMemo(() => {
    return location.pathname.includes("shuffle-multiclass");
  }, [location]);

  function handleSetRegion(rg: REGION) {
    let newPath;
    if (isMeta) {
      newPath = generatePath(metaUrls.page, { region: rg });
    } else if (isShuffleMclass) {
      newPath = generatePath(shuffleMulticlassUrls.page, { region: rg  });
    } else {
      newPath = generatePath(publicUrls.page, { region: rg , activity, bracket });
    }
    navigate(newPath + window.location.search);
  }

  function navigateToPage({
    activity,
    bracket,
  }: {
    activity: string;
    bracket: string;
  }) {
    let params = new URL(document.location.toString()).searchParams;
    let specs = params.get("specs");
    var newPath = generatePath(publicUrls.page, {
      region,
      activity,
      bracket,
    });
    if (specs !== undefined && specs !== null) {
      newPath = newPath + "?specs=" + specs;
    }
    navigate(newPath);
  }

  function redirectToMeta() {
    navigate("/" + region + "/meta" + window.location.search);
  }

  function redirectToLadder() {
    navigateToPage({
      activity: "ladder",
      bracket: isMeta || isShuffleMclass ? BRACKETS.shuffle : bracket,
    });
  }

  function redirectToActivity() {
    navigateToPage({
      activity: "activity",
      bracket: isMeta || isShuffleMclass ? BRACKETS.shuffle : bracket,
    });
  }

  function redirectToMulticlassers() {
    navigateToPage({ activity: "ladder", bracket: "shuffle-multiclass" });
  }

  const menuItems = [
    { label: "Activity", onClick: redirectToActivity },
    { label: "Leaderboards", onClick: redirectToLadder },
    { label: "Multiclassers", onClick: redirectToMulticlassers },
    { label: "Meta", onClick: redirectToMeta },
  ];
  
  const isMobile = breakpoint === "mobile" || breakpoint === "tablet"
  const View = isMobile ? MobileView : DesktopView;
  return (
    <StyledAppBar position="fixed">
      <StyledToolbar disableGutters>
        <View
          region={region}
          setRegion={handleSetRegion}
          menuItems={menuItems}
          host={host}
        />
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Header;
