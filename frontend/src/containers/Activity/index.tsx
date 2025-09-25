import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import ActivityTabs from "./Tabs";
import DataTable from "@/components/DataTable";
import Footer from "@/components/Footer";
import { REGION } from "@/constants/region";
import { BRACKETS } from "@/constants/pvp-activity";
import { getActivityFromUrl, getBracket, getRegion } from "@/utils/urlparts";
import { capitalizeFirstLetter } from "@/utils/common";
import { fetchBracketActivity } from "@/services/stats.service";
import MClassLeaderboard from "../MClassLeaderboard";
function Activity() {
  const { region = getRegion(), bracket = getBracket() } = useParams();
  const activity = getActivityFromUrl();
  const [bracketActivity, setBracketActivity] =
    useState<Record<BRACKETS, string>>();
  const getBracketActivity = async (region: REGION) => {
    const data = await fetchBracketActivity(region);
    setBracketActivity(data);
  };
  useEffect(() => {
    let title = `
    ${capitalizeFirstLetter(bracket)} 
    ${capitalizeFirstLetter(activity)} on ${region.toUpperCase()}`;
    if (bracket === "shuffle-multiclass") {
      title = "Shuffle Multiclassers Leaderboard on " + region.toUpperCase();
    }
    document.title = title;
  }, [region, activity, bracket]);
  useEffect(() => {
    getBracketActivity(region as REGION);
  }, [activity, region]);
  if (bracket === "shuffle-multiclass") {
    return (
      <>
        <Header />
        <MClassLeaderboard />
        <Footer />
      </>
    );
  } else {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 pt-16">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="mb-8 pt-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center sm:text-left">
                {capitalizeFirstLetter(bracket)}{" "}
                {capitalizeFirstLetter(activity)}
              </h1>
              <p className="text-gray-400 text-center sm:text-left">
                {region.toUpperCase()} Region • Real-time PvP Statistics
              </p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden">
              <ActivityTabs
                bracketActivity={
                  activity === "activity" ? bracketActivity : undefined
                }
              />
              <div className="p-0">
                <DataTable data={bracketActivity} />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }
}
export default Activity;
