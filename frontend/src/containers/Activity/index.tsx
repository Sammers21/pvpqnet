import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Header from '@/components/Header';
import ActivityTabs from './Tabs';
import DataTable from '@/components/DataTable';
import Footer from '@/components/Footer';

import { REGION } from '@/constants/region';
import { BRACKETS } from '@/constants/pvp-activity';
import { getActivityFromUrl, getBracket, getRegion } from '@/utils/urlparts';
import { capitalizeFirstLetter } from '@/utils/common';
import { fetchBracketActivity } from '@/services/stats.service';
import MClassLeaderboard from '../MClassLeaderboard';

function Activity() {
  const { region = getRegion(), bracket = getBracket() } = useParams();
  const activity = getActivityFromUrl();

  const [bracketActivity, setBracketActivity] = useState<Record<BRACKETS, string>>();

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
        <div className="mt-24 mx-auto mb-11 w-full lg:w-[85%]">
          <ActivityTabs
            bracketActivity={activity === "activity" ? bracketActivity : undefined}
          />
          <DataTable data={bracketActivity} />
        </div>
        <Footer />
      </>
    );
  }
}

export default Activity;