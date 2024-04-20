import { getRatingColor, getSeasonRankImageFromRating } from '@/utils/table';

interface IProps {
  bracket: string;
  statistic: any;
}

const ratingRewardMap = {
  '3v3': 'ARENA_3v3',
  rbg: 'BATTLEGROUNDS/alliance',
};

const CutOffText = ({ bracket, statistic }: IProps) => {
  const rankOneTitleColor = getRatingColor(true);

  const rewards = statistic?.cutoffs?.rewards;
  const spotWithNoAlts = statistic?.cutoffs?.spotWithNoAlts
  const cutOffRating = rewards?.[ratingRewardMap[bracket]];
  const spotsWithNoAlts = spotWithNoAlts?.[ratingRewardMap[bracket]];

  return (
    <span className="text-xs sm:text-lg font-light" style={{ color: rankOneTitleColor }}>
      {bracket === '3v3'
        ? `Verdant Gladiator: Dragonflight Season 3 - Rating: ${cutOffRating}. Spots: ${spotsWithNoAlts}`
        : `Hero of the Alliance & Horde: Verdant - Rating: ${cutOffRating}. Spots: ${spotsWithNoAlts}`}
    </span>
  );
};

const CutOffRating = ({ bracket, statistic }: IProps) => {
  if (!statistic?.cutoffs?.rewards?.ARENA_3v3 || !['rbg', '3v3'].includes(bracket)) {
    return <div></div>;
  }

  return (
    <div className="flex items-center mr-2">
      <img className="w-7 h-7 mr-2" src={getSeasonRankImageFromRating(0, true)} alt="Season Rank" />
      <CutOffText statistic={statistic} bracket={bracket} />
    </div>
  );
};

export default CutOffRating;
