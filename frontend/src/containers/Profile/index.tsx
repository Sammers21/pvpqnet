import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Alert, Snackbar as MuiSnackbar, styled } from "@mui/material";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import Armory from "./Armory";
import PlayerNotFound from "./PlayerNotFound";
import Footer from "@/components/Footer";

import { capitalizeFirstLetter } from "@/utils/common";
import type { Player } from "@/types";
import { getProfile } from "@/services/stats.service";

const Snackbar = styled(MuiSnackbar)({
  borderRadius: 4,
  border: "1px solid #66BB6ACC",

  "& .MuiPaper-root": {
    backgroundColor: "#030303e6",
  },
  "& .MuiAlert-action": {
    display: "none",
  },
});

const ProfileSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-2 md:gap-4">
    {/* Left Column - Desktop */}
    <div className="hidden lg:flex flex-col gap-4 w-[300px] min-w-[300px]">
      {/* Character Card */}
      <div className="animate-pulse h-[450px] rounded-xl border border-slate-700/50 bg-slate-900/60 relative overflow-hidden">
        <div className="absolute top-4 left-4 right-4 space-y-3">
          <div className="h-6 w-3/4 bg-slate-800 rounded" />
          <div className="h-4 w-1/2 bg-slate-800 rounded" />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
          <div className="h-10 w-10 bg-slate-800 rounded-lg" />
          <div className="h-10 w-10 bg-slate-800 rounded-lg" />
        </div>
      </div>
      {/* Notable Titles */}
      <div className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-3">
        <div className="h-5 w-32 bg-slate-800 rounded" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-slate-800" />
            <div className="h-4 w-24 bg-slate-800 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-slate-800" />
            <div className="h-4 w-32 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
      {/* Titles History */}
      <div className="animate-pulse flex-1 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-4">
        <div className="h-5 w-28 bg-slate-800 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-800/50 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
    {/* Right Column */}
    <div className="flex flex-col gap-4 grow">
      {/* Mobile Player Card Placeholder */}
      <div className="lg:hidden animate-pulse h-[400px] rounded-xl border border-slate-700/50 bg-slate-900/60" />
      {/* Header Stats */}
      <div className="animate-pulse h-24 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 flex gap-4 items-center overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-full bg-slate-800/30 rounded-lg border border-slate-700/30" />
        ))}
      </div>
      {/* Arena & RBG */}
      <div className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
          <div className="h-6 w-32 bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-slate-800/30 rounded-xl border border-slate-700/30 p-3 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-800" />
              <div className="h-8 w-24 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Solo Shuffle */}
      <div className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-4">
        <div className="h-6 w-32 bg-slate-800 rounded mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-slate-800/30 rounded-xl border border-slate-700/30 p-3 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-800" />
              <div className="h-8 w-24 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Battleground Blitz */}
      <div className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-4">
        <div className="h-6 w-40 bg-slate-800 rounded mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-slate-800/30 rounded-xl border border-slate-700/30 p-3 flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-800" />
              <div className="h-8 w-24 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Activity Diagram & Charts */}
      <div className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-4">
        <div className="h-6 w-64 bg-slate-800 rounded" />
        <div className="h-40 w-full bg-slate-800/30 rounded border border-slate-700/30" />
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="h-64 bg-slate-800/30 rounded border border-slate-700/30" />
          <div className="h-64 bg-slate-800/30 rounded border border-slate-700/30" />
        </div>
      </div>
      {/* Alts Table */}
      <div className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 space-y-4">
        <div className="h-6 w-24 bg-slate-800 rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-800/30 rounded border border-slate-700/30" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Profile = () => {
  let { region, realm, name } = useParams();
  const [openSnackbar, setOpenSnakbar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playerStatus, setPlayerStatus] = useState(200);
  const [player, setPlayer] = useState<Player | null>(null);

  const title = `${capitalizeFirstLetter(name)}-${capitalizeFirstLetter(
    realm
  )} on ${region?.toUpperCase()}`;
  const description = player
    ? `View PvP profile for ${player.name} (${player.race} ${player.class
    }) on ${region?.toUpperCase()} ${player.realm
    }. Check ratings, gear, talents, and match history.`
    : `View PvP profile for ${capitalizeFirstLetter(
      name
    )} on ${region?.toUpperCase()} ${capitalizeFirstLetter(realm)}.`;

  useEffect(() => {
    loadProfile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, realm, name]);

  async function loadProfile(update: boolean) {
    setLoading(true);
    const profile = await getProfile(region, realm, name, update);
    const { playerStatus: responseStatus, player: data } = profile;
    if (update && responseStatus !== 404) setOpenSnakbar(true);
    setPlayerStatus(responseStatus);
    setPlayer(data);
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background effects */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[600px] w-[700px] -translate-y-1/3 rounded-full bg-sky-500/8 blur-[150px]"></div>
        <div className="absolute bottom-0 right-0 h-[500px] w-[600px] translate-x-1/4 translate-y-1/4 rounded-full bg-blue-600/6 blur-[140px]"></div>
        <div className="absolute left-0 top-1/2 h-[400px] w-[500px] -translate-x-1/4 rounded-full bg-indigo-500/5 blur-[130px]"></div>
      </div>
      <SEO
        title={title}
        description={description}
        image={player?.media?.main_raw}
        type="profile"
      />
      <Header />
      <main className="flex-1">
        {playerStatus === 404 ? (
          <PlayerNotFound
            loading={loading}
            updatePlayer={() => loadProfile(true)}
          />
        ) : (
          <div className="flex w-full justify-center pt-20 pb-11 md:pt-24">
            <div className="h-full w-full rounded-lg px-4 xl:w-10/12 xl:px-0 2xl:w-[1180px]">
              {player ? (
                <Armory
                  player={player}
                  loading={loading}
                  updatePlayer={() => loadProfile(true)}
                />
              ) : (
                loading && <ProfileSkeleton />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={2000}
        open={openSnackbar}
        onClose={() => setOpenSnakbar(false)}
      >
        <Alert onClose={() => setOpenSnakbar(false)} severity="success">
          Player profile successfully updated!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Profile;
