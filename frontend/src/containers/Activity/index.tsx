import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import Footer from '../../components/common/Footer';

import Tabs from '../../components/TablePageFeatures/Tabs';
import DataTable from '../../components/TablePageFeatures/DataTable';

import { capitalizeFirstLetter } from '../../utils/common/capitalizeFirstLetter';
import { REGION, BRACKET, ACTIVITY } from '../../constants';
import { fetchStatistic } from '../../services/data.service';

function Activity() {
  const {
    region = REGION.eu,
    activity = ACTIVITY.activity,
    bracket = BRACKET.shuffle,
  } = useParams();

  const [statistic, setStatistic] = useState<Record<BRACKET, string>>();

  const getStatistic = async (region: REGION) => {
    const data = await fetchStatistic(region);
    setStatistic(data);
  };

  useEffect(() => {
    const title = `${capitalizeFirstLetter(bracket)} ${capitalizeFirstLetter(
      activity
    )} on ${region.toUpperCase()}`;

    document.title = title;
  }, [region, activity, bracket]);

  useEffect(() => {
    if (activity === ACTIVITY.activity) {
      getStatistic(region as REGION);
    }
    setStatistic(undefined);
  }, [activity, region]);

  return (
    <>
      <PageHeader />
      <div className="mt-24 mx-auto mb-11 w-full lg:w-[85%]">
        <Tabs statistic={statistic} />
        <DataTable />
      </div>
      <Footer />
    </>
  );
}

export default Activity;
