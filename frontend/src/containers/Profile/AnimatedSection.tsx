import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type AnimatedSectionProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  hoverEffect?: boolean;
  cascade?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const AnimatedSection = ({
  children,
  delay = 0,
  duration = 850,
  className = "",
  hoverEffect = true,
  cascade = false,
  style,
  ...rest
}: AnimatedSectionProps) => {
  const animationStyle: CSSProperties = {
    animationDelay: `${delay}ms`,
    ...style,
  };
  (animationStyle as Record<string, string>)["--profile-anim-delay"] = `${delay}ms`;
  (animationStyle as Record<string, string>)["--profile-anim-duration"] = `${duration}ms`;
  const classes = [
    "profile-animate",
    hoverEffect ? "profile-hover" : "",
    cascade ? "profile-animate-cascade" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={animationStyle} {...rest}>
      {children}
    </div>
  );
};

export default AnimatedSection;

