import { useState } from "react";
import { useDebounce } from "react-use";
import { useNavigate } from "react-router-dom";
import { uniqBy } from "lodash";
import { styled, keyframes } from "@mui/material/styles";

import {
  Autocomplete,
  InputAdornment,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import { getClassIcon, getClassNameColor, ratingToColor, getRaceIcon } from "@/utils/table";
import { EuIcon, UsIcon } from "../IIcons";

import { searchPlayers } from "@/services/stats.service";
import { capitalizeNickname } from "@/utils/urlparts";
import { capitalizeFirstLetter } from "@/utils/common";

// Import achievement icons
import rankR1 from "@/assets/ranks/rank_10.png";
import rankGladiator from "@/assets/ranks/rank_9.png";
import rankLegend from "@/assets/ranks/rank_legend.png";
import rankElite from "@/assets/ranks/rank_8.png";
import rankDuelist from "@/assets/ranks/rank_7.png";
import rankRival from "@/assets/ranks/rank_6.png";
import rankChallenger from "@/assets/ranks/rank_4.png";
import rankCombatant from "@/assets/ranks/rank_2.png";

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
const SearchContainer = styled(Box)({
  width: "100%",
  position: "relative",
});

const StyledAutocomplete = styled(Autocomplete)({
  padding: 0,
  width: "100%",
  "& .MuiTextField-root": {
    background: "transparent",
  },
  "& .MuiOutlinedInput-root": {
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "2px 8px !important",
    overflow: "hidden", // Ensures child elements don't bleed out of rounded corners
    "&:hover": {
      background: "rgba(255, 255, 255, 0.06)",
      borderColor: "rgba(255, 255, 255, 0.15)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    },
    "&.Mui-focused": {
      background: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(96, 165, 250, 0.4)",
      boxShadow:
        "0 0 0 2px rgba(96, 165, 250, 0.15), 0 8px 30px rgba(0, 0, 0, 0.3)",
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none !important",
    display: "none !important",
  },
  "& fieldset": {
    border: "none !important",
    display: "none !important",
  },
  "& .MuiInputLabel-root": {
    display: "none",
  },
  "& .MuiInputBase-input": {
    color: "#e2e8f0",
    padding: "6px 0 !important",
    "&::placeholder": {
      color: "rgba(148, 163, 184, 0.5)",
      opacity: 1,
    },
  },
  "& .MuiAutocomplete-popper": {
    width: "100% !important",
  },
  "& .MuiInputAdornment-root": {
    color: "rgba(148, 163, 184, 0.5)",
  },
});

const StyledListbox = styled("ul")({
  background: "rgba(5, 12, 25, 0.95)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  marginTop: "12px",
  padding: "8px",
  maxHeight: "400px",
  overflowY: "auto",
  overflowX: "hidden",
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
  animation: `${slideIn} 0.2s ease-out`,
  width: "100%",
  minWidth: "100%",
  boxSizing: "border-box",
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(148, 163, 184, 0.1)",
    borderRadius: "3px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(148, 163, 184, 0.3)",
    borderRadius: "3px",
    "&:hover": {
      background: "rgba(148, 163, 184, 0.5)",
    },
  },
});

const SearchResultItem = styled("li")<{ index?: number }>(({ index = 0 }) => ({
  display: "flex",
  alignItems: "center",
  padding: "10px 12px",
  margin: "4px 6px",
  borderRadius: "12px",
  cursor: "pointer",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  animation: `${slideIn} 0.2s ease-out`,
  animationDelay: `${index * 30}ms`,
  animationFillMode: "backwards",
  width: "calc(100% - 12px)",
  boxSizing: "border-box",
  overflow: "hidden",
  "&:hover": {
    background:
      "linear-gradient(90deg, rgba(96, 165, 250, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)",
    transform: "translateX(2px)",
    "& .achievement-icon": {
      transform: "scale(1.1)",
    },
  },
  "&.Mui-focused": {
    background: "rgba(96, 165, 250, 0.15)",
  },
}));

const IconContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

const AchievementIcon = styled("img")({
  width: "22px",
  height: "22px",
  transition: "transform 0.2s ease",
  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
});

const ClassIcon = styled("img")({
  width: "28px",
  height: "28px",
  borderRadius: "6px",
  transition: "transform 0.2s ease",
  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))",
});

const RaceIconOverlay = styled("img")({
  position: "absolute",
  bottom: "-3px",
  right: "-3px",
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  border: "1px solid #0f172a",
  zIndex: 1,
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
});

const PlayerName = styled(Typography)({
  fontWeight: 500,
  letterSpacing: "0.3px",
  transition: "color 0.2s ease",
  display: "flex",
  alignItems: "center",
  minWidth: 0,
});

const RatingBadge = styled(Box)<{ ratingcolor: string }>(({ ratingcolor }) => ({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 8px",
  borderRadius: "6px",
  background: `${ratingcolor}15`,
  border: `1px solid ${ratingcolor}30`,
  flexShrink: 0,
  whiteSpace: "nowrap",
}));

const RankText = styled(Typography)({
  fontSize: "0.7rem",
  color: "rgba(148, 163, 184, 0.8)",
  fontWeight: 600,
});

const BracketText = styled(Typography)({
  fontSize: "0.65rem",
  color: "rgba(148, 163, 184, 0.6)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
});

const AchievementText = styled(Typography)<{ achievementcolor: string }>(
  ({ achievementcolor }) => ({
    fontSize: "0.75rem",
    color: achievementcolor,
    fontWeight: 500,
    padding: "2px 8px",
    borderRadius: "4px",
    background: `${achievementcolor}15`,
    whiteSpace: "nowrap",
    flexShrink: 0,
  })
);

const AnimatedSearchIcon = styled(SearchIcon)<{ isloading: string }>(
  ({ isloading }) => ({
    color: isloading === "true" ? "#60a5fa" : "rgba(148, 163, 184, 0.6)",
    transition: "all 0.3s ease",
    animation: isloading === "true" ? `${pulse} 1s infinite` : "none",
  })
);

interface ISearchResults {
  nick: string;
  region: string;
  class: string;
  race?: string;
  gender?: string;
  highest_achievement?: string;
  highest_achievement_times?: number;
  highest_achievement_tier?: number;
  best_rank?: number;
  best_rating?: number;
  in_bracket?: string;
}

const getAchievementIcon = (achievement?: string): string | null => {
  if (!achievement) return null;
  switch (achievement) {
    case "Rank 1 in 3v3":
    case "Rank 1 in Solo":
    case "Rank 1 in Blitz":
    case "Hero":
      return rankR1;
    case "Gladiator":
      return rankGladiator;
    case "Legend":
    case "Strategist":
      return rankLegend;
    case "Elite":
      return rankElite;
    case "Duelist":
      return rankDuelist;
    case "Rival":
      return rankRival;
    case "Challenger":
      return rankChallenger;
    case "Combatant":
      return rankCombatant;
    default:
      return null;
  }
};

const getAchievementColor = (tier?: number): string => {
  if (tier === 0) return "#fb7e00";
  if (tier === 1) return "#a335ee";
  if (tier === 2) return "#2b8cb9";
  return "#64748b";
};

const PlayersSearch = () => {
  const navigate = useNavigate();
  const delay = 5;
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ISearchResults[]>([]);

  useDebounce(
    async () => {
      if (inputValue === "") {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      const data = (await searchPlayers(inputValue)) as ISearchResults[];
      const players = uniqBy(data, "nick");
      setSearchResults(players);
      setLoading(false);
    },
    delay,
    [inputValue]
  );

  const redirectToProfile = (option: string | ISearchResults) => {
    if (typeof option === "string") return;
    const nicknameSplit = option.nick.split(/-(.*)/s);
    const realm = capitalizeFirstLetter(nicknameSplit[1]);
    const name = capitalizeFirstLetter(nicknameSplit[0]);
    navigate(`/${option.region}/${realm}/${name}`);
  };

  const first = (count: number, results: ISearchResults[]) => {
    return results.slice(0, count);
  };

  const renderSearchOption = (
    props: React.HTMLAttributes<HTMLLIElement>,
    option: ISearchResults,
    state: { index: number }
  ) => {
    const hasClass = option.class && option.class !== "null";
    const classIcon = hasClass ? getClassIcon(option.class) : null;
    const raceIcon = option.race
      ? getRaceIcon(option.gender || "Male", option.race)
      : null;
    const achievementIcon = getAchievementIcon(option.highest_achievement);
    const RegionIcon =
      option.region === "us" || option.region === "en-us" ? UsIcon : EuIcon;
    const parts = option.nick.split("-");
    const name = capitalizeFirstLetter(parts[0]);
    const realm = parts
      .slice(1)
      .map((p) => capitalizeFirstLetter(p))
      .join(" ");
    const hasRankOrRating = option.best_rank || option.best_rating;
    const ratingColor = option.best_rating
      ? ratingToColor(
          option.best_rating,
          option.best_rank !== undefined && option.best_rank <= 100
        )
      : "#FFFFFF";

    return (
      <SearchResultItem {...props} index={state.index} key={option.nick}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <IconContainer
            sx={{
              flexShrink: 0,
              minWidth: 0,
              mr: 2,
            }}
          >
            {achievementIcon && (
              <AchievementIcon
                className="achievement-icon"
                src={achievementIcon}
                alt={option.highest_achievement}
                title={option.highest_achievement}
              />
            )}
            {classIcon && (
              <Box sx={{ position: "relative", width: 28, height: 28, mr: 0.5 }}>
                <ClassIcon
                  src={classIcon}
                  alt={option.class}
                  style={{ width: "100%", height: "100%" }}
                />
                {raceIcon && (
                  <RaceIconOverlay src={raceIcon} alt={option.race || "race"} />
                )}
              </Box>
            )}
            <PlayerName
              color={hasClass ? getClassNameColor(option.class) : "#e2e8f0"}
              sx={{
                fontSize: "0.95rem",
              }}
            >
              <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                {name}
              </Box>
              <Box
                component="span"
                sx={{
                  color: "rgba(148, 163, 184, 0.5)",
                  ml: 1,
                  fontSize: "0.85em",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                }}
              >
                {realm}
              </Box>
            </PlayerName>
          </IconContainer>

          {/* Middle: Badge (hides if no space) */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              overflow: "hidden",
              height: "26px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexShrink: 0,
                  height: "26px",
                  maxWidth: "100%", // Ensure it doesn't overflow parent width without wrapping logic kicking in or truncation
                }}
              >
                {hasRankOrRating && (
                  <RatingBadge
                    ratingcolor={ratingColor}
                    sx={{
                      flexShrink: 0, // Prevent shrinking
                    }}
                  >
                    {option.best_rating && (
                      <Typography
                        sx={{
                          fontSize: "0.8rem",
                          color: ratingColor,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {option.best_rating}
                      </Typography>
                    )}
                    {option.best_rank && (
                      <RankText>#{option.best_rank}</RankText>
                    )}
                    {option.in_bracket && (
                      <BracketText>{option.in_bracket}</BracketText>
                    )}
                  </RatingBadge>
                )}
                {option.highest_achievement && !hasRankOrRating && (
                  <AchievementText
                    achievementcolor={getAchievementColor(
                      option.highest_achievement_tier
                    )}
                    sx={{
                      flexShrink: 0, // Prevent shrinking
                    }}
                  >
                    {option.highest_achievement}
                    {option.highest_achievement_times &&
                      option.highest_achievement_times > 1 && (
                        <span style={{ opacity: 0.7 }}>
                          {" "}
                          ×{option.highest_achievement_times}
                        </span>
                      )}
                  </AchievementText>
                )}
              </Box>
            </Box>
          </Box>

          {/* Right: Region */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              opacity: 0.7,
              transition: "opacity 0.2s",
              "&:hover": { opacity: 1 },
              flexShrink: 0,
              ml: 1.5,
            }}
          >
            <RegionIcon style={{ width: 18, height: 18 }} />
          </Box>
        </Box>
      </SearchResultItem>
    );
  };

  return (
    <SearchContainer>
      <StyledAutocomplete
        ListboxComponent={StyledListbox as any}
        className="w-full"
        disablePortal
        freeSolo
        loading={loading}
        filterOptions={(x) => first(15, x as ISearchResults[])}
        options={searchResults}
        getOptionLabel={(option) => {
          return capitalizeNickname(
            typeof option === "string"
              ? option
              : (option as ISearchResults).nick
          );
        }}
        renderOption={renderSearchOption as any}
        onChange={(_, newValue) => {
          redirectToProfile(newValue as ISearchResults);
        }}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        disableClearable
        loadingText={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              color: "rgba(148, 163, 184, 0.8)",
            }}
          >
            <CircularProgress size={20} sx={{ color: "#60a5fa" }} />
            <Typography sx={{ fontSize: "0.9rem" }}>
              Searching players...
            </Typography>
          </Box>
        }
        noOptionsText={
          <Typography
            sx={{
              p: 2,
              color: "rgba(148, 163, 184, 0.6)",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          >
            No players found
          </Typography>
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search for characters..."
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  <InputAdornment position="end">
                    {loading ? (
                      <CircularProgress
                        size={20}
                        sx={{ color: "#60a5fa", ml: 0.5 }}
                      />
                    ) : (
                      <AnimatedSearchIcon isloading={loading.toString()} />
                    )}
                  </InputAdornment>
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </SearchContainer>
  );
};

export default PlayersSearch;
