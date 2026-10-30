type ArrowIconProps = {
  direction?: "up-right" | "down-right";
  className?: string;
};

/** Draw arrows as SVG so emoji-capable text glyphs stay consistent in Safari. */
export function ArrowIcon({
  direction = "up-right",
  className,
}: ArrowIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      style={{ display: "inline-block", verticalAlign: "-0.14em", flex: "none" }}
    >
      {direction === "down-right" ? (
        <path d="M7 7 17 17M17 7v10H7" />
      ) : (
        <path d="M7 17 17 7M7 7h10v10" />
      )}
    </svg>
  );
}
