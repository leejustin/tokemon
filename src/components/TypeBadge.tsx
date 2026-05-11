import { TYPE_META } from "../data/typeMeta";
import type { ModelType } from "../data/types";

interface Props {
  type: ModelType;
  size?: "xs" | "sm" | "md";
  onClick?: () => void;
  active?: boolean;
  variant?: "solid" | "soft";
}

export function TypeBadge({ type, size = "sm", onClick, active, variant = "soft" }: Props) {
  const meta = TYPE_META[type];

  const sizes = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2 py-1 gap-1",
    md: "text-xs px-2.5 py-1.5 gap-1.5",
  };

  const solid = `${meta.bg} ${meta.text}`;
  const soft = `${meta.bg.replace("bg-", "bg-").replace("-600", "-500/15").replace("-500", "-400/15")} ${meta.text.replace("-100", "-300").replace("-50", "-200").replace("-950", "-300")} ring-1 ring-inset ${meta.ring.replace("ring-", "ring-").replace("-400", "-500/30").replace("-300", "-400/30")}`;

  const className = `inline-flex items-center font-semibold tracking-wide rounded-md ${
    sizes[size]
  } ${variant === "solid" ? solid : soft} ${
    onClick ? "hover:brightness-110 cursor-pointer transition" : "cursor-default"
  } ${active ? "ring-2 ring-white/70" : ""}`;

  const content = (
    <>
      <span className="opacity-80 leading-none" style={{ fontFamily: "Orbitron, sans-serif" }}>
        {meta.glyph}
      </span>
      <span className="leading-none">{meta.label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={className}
      >
        {content}
      </button>
    );
  }
  return <span className={className}>{content}</span>;
}
