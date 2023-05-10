import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import Footer from '../../components/common/Footer';

import Tabs from '../../components/TablePageFeatures/Tabs';
import DataTable from '../../components/TablePageFeatures/DataTable';

import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';
import { REGION, BRACKET, ACTIVITY } from '../../constants';

function Activity() {
  const {
    region = REGION.eu,
    activity = ACTIVITY.activity,
    bracket = BRACKET.shuffle,
  } = useParams();

  useEffect(() => {
    const title = `${capitalizeFirstLetter(bracket)} ${capitalizeFirstLetter(
      activity
    )} on ${region.toUpperCase()}`;

    document.title = title;
  }, [region, activity, bracket]);

  return (
    <>
      <PageHeader />
      <div className="mt-24 mx-auto mb-11 w-full lg:w-[85%]">
        <Tabs />
        <DataTable />
      </div>
      <Footer />
    </>
  );
}

export default Activity;
