import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { generatePath } from "react-router";

import BoltIcon from "@mui/icons-material/Bolt";
import EmojiFlagsIcon from "@mui/icons-material/EmojiFlags";
import Groups2Icon from "@mui/icons-material/Groups2";
import Groups3Icon from "@mui/icons-material/Groups3";
import InsightsIcon from "@mui/icons-material/Insights";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ShuffleIcon from "@mui/icons-material/Shuffle";

import Header from "@/components/Header";
import SEO from "@/components/SEO";
import ActivityTabs from "./Tabs";
import UpdateTimer from "@/components/UpdateTimer";
import DataTable from "@/components/DataTable";
import Footer from "@/components/Footer";
import ActivityStat from "@/components/ActivityStat";
import { EuIcon, UsIcon } from "@/components/IIcons";

import { REGION } from "@/constants/region";
import { BRACKETS } from "@/constants/pvp-activity";
import { publicUrls } from "@/config";
import { getActivityFromUrl, getBracket, getRegion } from "@/utils/urlparts";
import { capitalizeFirstLetter } from "@/utils/common";
import { fetchBracketActivity } from "@/services/stats.service";
import MClassLeaderboard from "../MClassLeaderboard";

function Activity() {
  const navigate = useNavigate();
  const location = useLocation();
  const { region: regionFromUrl, bracket: bracketFromUrl } = useParams();
  const region = getRegion(regionFromUrl);
  const activity = getActivityFromUrl();
  const bracketParam = bracketFromUrl ?? getBracket();
  const bracket = getBracket(bracketParam);
  const formattedActivity =
    activity === "ladder"
      ? "Leaderboards"
      : capitalizeFirstLetter(activity) || "Activity";
  const isShuffleMulticlass = bracketFromUrl === "shuffle-multiclass";

  const [bracketActivity, setBracketActivity] =
    useState<Record<BRACKETS, string>>();
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>();

  const getBracketActivity = async (region: REGION) => {
    const data = await fetchBracketActivity(region);
    setBracketActivity(data);
    // Explicitly cast to any because fetchBracketActivity return type is inferred as Record<BRACKETS, string> 
    // but the API might return more fields like timestamp
    if ((data as any)?.timestamp) {
      setLastUpdateTimestamp((data as any).timestamp);
    }
  };

  const title = isShuffleMulticlass
    ? "Shuffle Multiclassers Leaderboard on " + region.toUpperCase()
    : `${capitalizeFirstLetter(
        bracket
      )} ${formattedActivity} on ${region.toUpperCase()}`;

  const description = isShuffleMulticlass
    ? `View Solo Shuffle Multiclassers Leaderboard for ${region.toUpperCase()}.`
    : `View ${capitalizeFirstLetter(
        bracket
      )} ${formattedActivity} for ${region.toUpperCase()}.`;

  useEffect(() => {
    getBracketActivity(region);
  }, [activity, region]);

  const handleRegionChange = (nextRegion: REGION) => {
    const newPath = generatePath(publicUrls.page, {
      region: nextRegion,
      activity,
      bracket,
    });
    navigate(`${newPath}${location.search}`);
  };
  const handleBracketChange = (nextBracket: BRACKETS) => {
    const newPath = generatePath(publicUrls.page, {
      region,
      activity,
      bracket: nextBracket,
    });
    navigate(`${newPath}${location.search}`);
  };
  const handleActivityChange = (nextActivity: "activity" | "ladder") => {
    const newPath = generatePath(publicUrls.page, {
      region,
      activity: nextActivity,
      bracket,
    });
    navigate(`${newPath}${location.search}`);
  };

  if (isShuffleMulticlass) {
    return (
      <div className="flex min-h-screen flex-col">
        <SEO title={title} description={description} />
        <Header />
        <main className="flex-1">
          <MClassLeaderboard />
        </main>
        <Footer />
      </div>
    );
  }
  const formattedBracket =
    bracket === "rbg" ? bracket.toUpperCase() : capitalizeFirstLetter(bracket);
  const regionLabel = region.toUpperCase();
  return (
    <div className="flex min-h-screen flex-col">
      <SEO title={title} description={description} />
      <Header />
      <main className="flex-1">
        <section className="activity-table-wrapper relative mt-16 px-2 pb-4 sm:mt-20 sm:px-4 sm:pb-6 md:mt-24 md:px-6 md:pb-8 lg:px-10 lg:pb-10">
          {/* Ambient background effects kept fixed to avoid shifting with content height */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-sky-500/8 blur-[150px]"></div>
            <div className="absolute bottom-0 left-0 h-[400px] w-[500px] -translate-x-1/4 translate-y-1/4 rounded-full bg-blue-600/6 blur-[130px]"></div>
            <div className="absolute bottom-1/4 right-0 h-[350px] w-[400px] translate-x-1/4 rounded-full bg-indigo-500/5 blur-[120px]"></div>
          </div>
          <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5 md:space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 px-4 py-4 shadow-[0_0_80px_-20px_rgba(56,189,248,0.25)] backdrop-blur-xl transition-all hover:border-sky-500/40 sm:rounded-2xl sm:px-6 sm:py-6">
              {/* <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-sky-400/20 blur-[110px]"></div> */}
              <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-44 rounded-full bg-blue-900/20 blur-[90px]"></div>
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-[80px]"></div>
              
              <div className="flex flex-col gap-2 xl:flex-row xl:flex-nowrap xl:items-center xl:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <h1 className="bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-xl font-bold leading-tight text-transparent drop-shadow-sm sm:text-2xl whitespace-nowrap">
                    {formattedBracket} {formattedActivity}
                  </h1>
                  
                  {lastUpdateTimestamp && (
                    <>
                      <div className="hidden h-8 w-px bg-sky-500/20 sm:block"></div>
                      <UpdateTimer timestamp={lastUpdateTimestamp} />
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:flex-nowrap xl:justify-end">
                  <ActivityStat
                    label="Region"
                    value={regionLabel}
                    selectedValue={region}
                    options={[
                      { value: REGION.eu, label: "EU", icon: <EuIcon /> },
                      { value: REGION.us, label: "US", icon: <UsIcon /> },
                    ]}
                    onSelect={(next) => handleRegionChange(next as REGION)}
                  />
                  <ActivityStat
                    label="Bracket"
                    value={formattedBracket}
                    selectedValue={bracket}
                    options={[
                      {
                        value: BRACKETS.shuffle,
                        label: "Shuffle",
                        icon: <ShuffleIcon />,
                      },
                      {
                        value: BRACKETS["2v2"],
                        label: "2v2",
                        icon: <Groups2Icon />,
                      },
                      {
                        value: BRACKETS["3v3"],
                        label: "3v3",
                        icon: <Groups3Icon />,
                      },
                      {
                        value: BRACKETS.blitz,
                        label: "Blitz",
                        icon: <BoltIcon />,
                      },
                      {
                        value: BRACKETS.rbg,
                        label: "RBG",
                        icon: <EmojiFlagsIcon />,
                      },
                    ]}
                    onSelect={(next) => handleBracketChange(next as BRACKETS)}
                  />
                  <ActivityStat
                    label="Activity"
                    value={formattedActivity}
                    selectedValue={activity}
                    options={[
                      {
                        value: "activity",
                        label: "Activity",
                        icon: <InsightsIcon />,
                      },
                      {
                        value: "ladder",
                        label: "Leaderboards",
                        icon: <LeaderboardIcon />,
                      },
                    ]}
                    onSelect={(next) =>
                      handleActivityChange(next as "activity" | "ladder")
                    }
                  />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-sky-500/15 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 pb-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:rounded-2xl sm:pb-6 md:pb-8">
              <ActivityTabs
                bracketActivity={
                  activity === "activity" ? bracketActivity : undefined
                }
              />
              <div className="px-2 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-6">
                <DataTable
                  data={bracketActivity}
                  onDataLoaded={(ts) => setLastUpdateTimestamp(ts)}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Activity;
