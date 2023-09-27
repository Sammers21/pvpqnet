import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Header from '../../components/AppHeader';
import ActivityTabs from './Tabs';
import DataTable from '../../components/DataTable';
import Footer from '../../components/common/Footer';

import { REGIONS } from '../../constants/region';
import { BRACKETS } from '../../constants/pvp-activity';
import { getActivityFromUrl } from '../../utils/urlparts';
import { capitalizeFirstLetter } from '../../utils/common';
import { fetchStatistic } from '../../services/stats.service';

function Activity() {
  const { region = REGIONS.eu, bracket = BRACKETS.shuffle } = useParams();
  const activity = getActivityFromUrl();

  const [statistic, setStatistic] = useState<Record<BRACKETS, string>>();

  const getStatistic = async (region: REGIONS) => {
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
    if (activity === 'activity') {
      getStatistic(region as REGIONS);
    }
    setStatistic(undefined);
  }, [activity, region]);

  return (
    <>
      <Header />
      <div className="mt-24 mx-auto mb-11 w-full lg:w-[85%]">
        <ActivityTabs statistic={statistic} />
        <DataTable />
      </div>
      <Footer />
    </>
  );
}

export default Activity;
