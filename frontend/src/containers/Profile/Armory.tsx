import { createBreakpoint } from "react-use";
import { useState } from "react";

import PlayerHeader from "./PlayerHeader";
import PlayerDesktop from "./PlayerCard/Desktop";
import PlayerMobile from "./PlayerCard/Mobile";
import PvpBrackets from "./PvpBrackets";
import GearModal from "./GearModal";

import TitlesHistory from "./TitlesHistory";
import AltsTable from "./Alts";
import GamingHistory from "./History";

import type { Player } from "@/types";
import ActivityDiagram from "./ActivityDiagram";
import MulticlassersCard from "./MulticlassersCard";
import AnimatedSection from "./AnimatedSection";
import { getCurrentSeason, type WowSeason } from "@/constants/seasons";

interface IProps {
  player: Player;
  loading: boolean;
  updatePlayer: () => void;
}

const useBreakpoint = createBreakpoint({ md: 768, lg: 1024 });
const Armory = ({ player, loading, updatePlayer }: IProps) => {
  const breakpoint = useBreakpoint();
  const [gearModalOpen, setGearModalOpen] = useState(false);
  const [gearModalTab, setGearModalTab] = useState(0);
  const [selectedSeason, setSelectedSeason] = useState<WowSeason>(
    getCurrentSeason()
  );
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-2 md:gap-4 rounded-lg">
        {breakpoint === "lg" && (
          <div className="flex flex-col gap-2 md:gap-4 lg:w-[300px] lg:min-w-[300px]">
            <AnimatedSection delay={50}>
              <PlayerDesktop player={player} />
            </AnimatedSection>
            <AnimatedSection delay={120}>
              <TitlesHistory player={player} />
            </AnimatedSection>
          </div>
        )}

        <div
          className="flex flex-col gap-2 grow lg:self-start rounded-lg"
          style={breakpoint === "lg" ? { maxWidth: "calc(100% - 300px)" } : {}}
        >
          {breakpoint === "md" && (
            <AnimatedSection delay={40}>
              <PlayerMobile player={player} />
            </AnimatedSection>
          )}
          <AnimatedSection delay={80}>
            <PlayerHeader
              player={player}
              updatePlayer={updatePlayer}
              loading={loading}
              onGearClick={() => {
                setGearModalTab(0);
                setGearModalOpen(true);
              }}
              onTalentsClick={() => {
                setGearModalTab(1);
                setGearModalOpen(true);
              }}
            />
          </AnimatedSection>
          <AnimatedSection delay={120}>
            <MulticlassersCard player={player} />
          </AnimatedSection>
          <AnimatedSection delay={160}>
            <PvpBrackets
              player={player}
              selectedSeason={selectedSeason}
              onSeasonChange={setSelectedSeason}
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <ActivityDiagram player={player} />
          </AnimatedSection>
          <AnimatedSection delay={240}>
            <AltsTable player={player} updatePlayer={updatePlayer} />
          </AnimatedSection>
          {player.brackets.find(
            (bracket) => bracket.gaming_history.history.length > 0
          ) && (
            <AnimatedSection delay={280}>
              <GamingHistory player={player} isMobile={breakpoint === "md"} />
            </AnimatedSection>
          )}
          {breakpoint === "md" && (
            <AnimatedSection delay={320}>
              <TitlesHistory player={player} />
            </AnimatedSection>
          )}
        </div>
      </div>

      {/* Gear Modal for PlayerHeader button */}
      <GearModal
        player={player}
        open={gearModalOpen}
        onClose={() => setGearModalOpen(false)}
        initialTab={gearModalTab}
      />
    </>
  );
};

export default Armory;
