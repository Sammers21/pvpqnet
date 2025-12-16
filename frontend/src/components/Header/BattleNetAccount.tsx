import battleNetLogo from "@/assets/bnet.svg";
import { Link } from "react-router-dom";

function getBattleTagName(battleTag: string) {
  let name = battleTag.split("#")[0]?.trim();
  if (!name) {
    name = battleTag;
  }
  return name;
}

type Props = {
  battleTag: string | null;
  isMeLoading: boolean;
  variant?: "standalone" | "group";
  className?: string;
  onNavigate?: () => void;
};

const BattleNetAccount = ({
  battleTag,
  isMeLoading,
  variant = "standalone",
  className,
  onNavigate,
}: Props) => {
  const baseInteractiveClassName =
    "inline-flex items-center gap-2 h-11 px-4 text-[#60a5fa] hover:text-[#93c5fd] font-semibold text-sm tracking-wide whitespace-nowrap transition-colors focus-visible:outline-none";
  const interactiveClassName =
    variant === "group"
      ? `${baseInteractiveClassName} bg-transparent hover:bg-white/[0.06]`
      : `${baseInteractiveClassName} rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#60a5fa]/60`;
  const iconClassName = "w-5 h-5 object-contain brightness-0 invert opacity-90";
  const motionClassName =
    variant === "group"
      ? ""
      : "transform-gpu hover:-translate-y-px active:translate-y-0";

  function handleLogin() {
    const returnUrl = encodeURIComponent(window.location.href);
    onNavigate?.();
    window.location.assign(`/api/auth?return_url=${returnUrl}`);
  }

  if (battleTag) {
    return (
      <Link
        to="/cabinet"
        title={battleTag}
        onClick={() => onNavigate?.()}
        className={`${interactiveClassName} shrink-0 ${motionClassName} ${
          className || ""
        }`}
      >
        <img
          src={battleNetLogo}
          alt=""
          aria-hidden="true"
          className={iconClassName}
        />
        {getBattleTagName(battleTag)}
      </Link>
    );
  }

  if (isMeLoading) {
    return (
      <>
        {variant === "group" ? (
          <span
            className={`inline-flex items-center h-10 px-4 ${className || ""}`}
            aria-label="Loading profile"
          >
            <span className="inline-flex h-4 w-24 rounded bg-slate-700/60 animate-pulse"></span>
          </span>
        ) : (
          <span
            className={`inline-flex h-10 w-32 rounded-lg bg-slate-700/60 animate-pulse ${
              className || ""
            }`}
            aria-label="Loading profile"
          ></span>
        )}
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      aria-label="Battle.net Login"
      className={`${interactiveClassName} shrink-0 ${
        variant === "group"
          ? ""
          : "border-[#60a5fa]/25 shadow-sm hover:shadow-md"
      } ${motionClassName} ${className || ""}`}
    >
      <img
        src={battleNetLogo}
        alt=""
        aria-hidden="true"
        className={iconClassName}
      />
      <span className="hidden lg:inline">Battle.net</span>
      <span>Login</span>
    </button>
  );
};

export default BattleNetAccount;
