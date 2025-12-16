import React, { useState } from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface ActivityStatOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}
interface ActivityStatProps {
  label: string;
  value: string;
  options?: ActivityStatOption[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
}

const ActivityStat: React.FC<ActivityStatProps> = ({
  label,
  value,
  options,
  selectedValue,
  onSelect,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isSelectable = Boolean(options?.length && onSelect);
  const menuId = `activity-stat-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const selectedOption =
    options?.find((option) => option.value === selectedValue) ?? options?.[0];
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isSelectable) return;
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (nextValue: string) => {
    if (!onSelect) return;
    onSelect(nextValue);
    handleClose();
  };
  if (!isSelectable) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-sky-500/20 bg-slate-900/90 px-2 py-1.5 text-[10px] tracking-wide text-sky-200 backdrop-blur-sm transition-all hover:border-sky-500/30 sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 sm:text-xs sm:shadow-[0_8px_24px_-12px_rgba(56,189,248,0.4)] sm:hover:shadow-[0_12px_32px_-12px_rgba(56,189,248,0.5)]">
        <span className="uppercase opacity-60">{label}</span>
        <span className="text-xs font-semibold text-sky-100 sm:text-sm">
          {value}
        </span>
      </div>
    );
  }
  return (
    <>
      <button
        type="button"
        aria-controls={open ? menuId : undefined}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : undefined}
        onClick={handleOpen}
        className="group flex min-w-[150px] items-center justify-between gap-3 rounded-md border border-sky-500/20 bg-gradient-to-b from-slate-900/90 to-slate-950/90 px-3 py-2 text-[10px] tracking-wide text-sky-200 backdrop-blur-sm transition-all hover:border-sky-500/35 hover:shadow-[0_14px_38px_-24px_rgba(56,189,248,0.75)] focus:outline-none focus:ring-2 focus:ring-sky-500/25 sm:min-w-[170px] sm:rounded-lg sm:text-xs"
      >
        <span className="uppercase opacity-60">{label}</span>
        <span className="flex items-center gap-2">
          {selectedOption?.icon ? (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20 [&>svg]:h-[18px] [&>svg]:w-[18px]">
              {selectedOption.icon}
            </span>
          ) : null}
          <span className="text-xs font-semibold text-sky-100 sm:text-sm">
            {value}
          </span>
          <KeyboardArrowDownIcon
            fontSize="small"
            className={`text-slate-400 transition-transform duration-200 group-hover:text-sky-200 ${
              open ? "rotate-180 text-sky-200" : ""
            }`}
          />
        </span>
      </button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 190,
            borderRadius: 1.5,
            overflow: "hidden",
            backgroundImage:
              "linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.96))",
            border: "1px solid rgba(56, 189, 248, 0.22)",
            backdropFilter: "blur(10px)",
            boxShadow:
              "0 24px 70px -35px rgba(0,0,0,0.95), 0 0 0 1px rgba(56,189,248,0.12)",
          },
        }}
        MenuListProps={{ dense: true, sx: { py: 0.75 } }}
      >
        {options?.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === selectedValue}
            onClick={() => handleSelect(option.value)}
            sx={{
              mx: 0.75,
              my: 0.25,
              borderRadius: 1.25,
              px: 1.25,
              py: 0.9,
              color: "#e2e8f0",
              transition: "all 0.15s ease",
              "&.Mui-selected": {
                backgroundImage:
                  "linear-gradient(90deg, rgba(56, 189, 248, 0.18), rgba(56, 189, 248, 0.06))",
                color: "#38bdf8",
              },
              "&.Mui-selected:hover": {
                backgroundImage:
                  "linear-gradient(90deg, rgba(56, 189, 248, 0.24), rgba(56, 189, 248, 0.08))",
              },
              "&:hover": {
                backgroundColor: "rgba(148, 163, 184, 0.08)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 34,
                color: option.value === selectedValue ? "#38bdf8" : "#94a3b8",
                "& svg": { width: 20, height: 20, display: "block" },
              }}
            >
              {option.icon}
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              primaryTypographyProps={{
                fontSize: 13,
                fontWeight: option.value === selectedValue ? 700 : 600,
                letterSpacing: "0.01em",
              }}
            />
            {option.value === selectedValue ? (
              <CheckRoundedIcon
                sx={{ ml: 1, fontSize: 18, color: "#38bdf8" }}
              />
            ) : null}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActivityStat;
