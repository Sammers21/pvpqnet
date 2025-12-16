import React from "react";
import { Helmet } from "react-helmet";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

const DEFAULT_TITLE =
  "PvPQ.net | World of Warcraft PvP Activity, Ladder for Solo Shuffle, Blitz, 3v3 and 2v2 Arena, Meta, Players profiles, AI coaching";
const DEFAULT_DESCRIPTION =
  "World of Warcraft PvP Ladder & Activity Tracker for Solo Shuffle, Blitz, 3v3 and 2v2 Arena, Rated Battlegrounds. R1 Rank One cutoffs, Gladiator cutoffs for every bracket. Player profiles with statistics, Meta analysis, AI post-game coaching, Multiclasser ratings, Hidden character tracking";
const DEFAULT_KEYWORDS =
  "World of Warcraft PvP, Solo Shuffle, Arena 3v3 leaderboard, Arena 3v3 ladder, Arena 2v2 ladder, Blitz ladder, Blitz activity, Rated Battlegrounds leaderboard, WoW Arena leaderboard, PvP stats, WoW ratings, AI arena coach, Arena Meta analysis, WoW PvP profiles, Rated Battlegrounds tracker, WoW PvP analytics, PvP character tracking, WoW PvP multiclass ratings, Shuffle Multiclassers ratings, R1 cutoff, Rank One cutoff, Gladiator cutoff, Solo Shuffle R1, 3v3 R1 cutoff, 2v2 R1 cutoff, Blitz R1 cutoff, RBG R1 cutoff, WoW Gladiator rating, TWW Season 3 cutoffs";

const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = "website",
  keywords = DEFAULT_KEYWORDS,
}) => {
  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="PVPQ.NET" />
      <meta name="copyright" content="PVPQ.NET" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="PVPQ.NET" />
      <meta property="og:locale" content="en_US" />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@pvpqnet" />
      <meta name="twitter:creator" content="@sammers_wow" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};

export default SEO;
