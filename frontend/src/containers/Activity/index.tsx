import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Header from '@/components/Header';
import ActivityTabs from './Tabs';
import DataTable from '@/components/DataTable';
import Footer from '@/components/Footer';

import { REGION } from '@/constants/region';
import { BRACKETS } from '@/constants/pvp-activity';
import { getActivityFromUrl } from '@/utils/urlparts';
import { capitalizeFirstLetter } from '@/utils/common';
import { fetchStatistic } from '@/services/stats.service';
import MClassLeaderboard from '../MClassLeaderboard';

function Activity() {
  const { region = REGION.eu, bracket = BRACKETS["3v3"] } = useParams();
  const activity = getActivityFromUrl();

  const [statistic, setStatistic] = useState<Record<BRACKETS, string>>();

  const getStatistic = async (region: REGION) => {
    const data = await fetchStatistic(region);
    setStatistic(data);
  };
  useEffect(() => {
    const title = `
    ${capitalizeFirstLetter(bracket)} 
    ${capitalizeFirstLetter(activity)} on ${region.toUpperCase()}`;

    document.title = title;
  }, [region, activity, bracket]);

  useEffect(() => {
    getStatistic(region as REGION);
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
            statistic={activity === "activity" ? statistic : undefined}
          />
          <DataTable data={statistic} />
        </div>
        <Footer />
      </>
    );
  }
}

export default Activity;
