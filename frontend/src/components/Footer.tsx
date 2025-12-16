import { DiscordIcon, GitHubIcon, XIcon } from "@/components/IIcons";
import ExternalLink from "@/components/ExternalLink";
import { getClassIcon } from "@/utils/table";
import { containerBg } from "@/theme";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const priest = getClassIcon("PRIEST");
  return (
    <footer className="border-t border-[#2f384de6]/70 backdrop-blur-sm" style={{ backgroundColor: containerBg }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 text-slate-200 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <img className="h-11 w-11 rounded-full border border-sky-500/40 bg-slate-900/80 p-1.5" src="/icons/original-logo-nobg.png" alt="pvpq.net logo" />
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-wide text-white">PVPQ.NET</p>
              <p className="text-xs text-slate-400">Live ladder stats, AI-powered coaching, multiclass rating insights, in-depth player intel, and Meta coverage for every arena bracket.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span>Made by</span>
            <ExternalLink className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-sky-400 transition-colors hover:bg-slate-800 hover:text-sky-300" href="https://github.com/Sammers21" color="#58a6ff">
              <img className="h-5 w-5 rounded-full" src={priest} alt="Priest icon" />
              Sammers
            </ExternalLink>
          </div>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="flex items-center gap-4">
            <ExternalLink className="rounded-full bg-slate-900/70 p-2 text-slate-100 transition-colors hover:bg-slate-800 hover:text-white" href="https://github.com/Sammers21/pvpqnet">
              <GitHubIcon />
            </ExternalLink>
            <ExternalLink className="rounded-full bg-slate-900/70 p-2 text-slate-100 transition-colors hover:bg-slate-800 hover:text-white" href="https://discord.gg/TxaZQh88Uf">
              <DiscordIcon />
            </ExternalLink>
            <ExternalLink className="rounded-full bg-slate-900/70 p-2 text-slate-100 transition-colors hover:bg-slate-800 hover:text-white" href="https://x.com/pvpqnet">
              <XIcon />
            </ExternalLink>
          </div>
          <p className="text-xs text-slate-500">© {currentYear} PVPQ.NET. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
