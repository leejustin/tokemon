import { useMemo } from "react";

export type Palette = Record<string, string>;

interface Props {
  /**
   * Sprite as an array of 16 (or N) equal-length strings.
   * Each character is a palette key. "." or " " is transparent.
   * "0" is conventionally the dark outline.
   */
  grid: readonly string[];
  /** Map from character key → CSS color */
  palette: Palette;
  /** Render size in pixels. Sprite stays crisp because each cell is an SVG rect. */
  size?: number;
  /** Subtle drop-shadow under the sprite */
  shadow?: boolean;
  /** Animate idle bob */
  animated?: boolean;
}

/**
 * Renders a tiny pixel-art sprite as crisp SVG rects. Each character in `grid`
 * becomes one rect colored from `palette`. Empty cells (".", " ") are skipped.
 */
export function PixelSprite({ grid, palette, size = 96, shadow = true, animated = true }: Props) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // Group adjacent cells of the same color in each row to reduce rect count.
  // Pure cosmetic perf optimization — visual output is identical.
  const runs = useMemo(() => {
    const out: { x: number; y: number; w: number; key: string }[] = [];
    for (let y = 0; y < rows; y++) {
      const row = grid[y];
      let x = 0;
      while (x < cols) {
        const ch = row[x];
        if (ch === "." || ch === " " || ch === undefined) {
          x++;
          continue;
        }
        let w = 1;
        while (x + w < cols && row[x + w] === ch) w++;
        out.push({ x, y, w, key: ch });
        x += w;
      }
    }
    return out;
  }, [grid, rows, cols]);

  const widthVB = cols;
  const heightVB = rows;

  return (
    <svg
      viewBox={`0 0 ${widthVB} ${heightVB}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={animated ? "animate-bobble" : undefined}
      style={{ display: "block", imageRendering: "pixelated" }}
      aria-hidden
    >
      {shadow && (
        <ellipse
          cx={cols / 2}
          cy={rows - 0.5}
          rx={cols * 0.32}
          ry={0.6}
          fill="rgba(0,0,0,0.35)"
        />
      )}
      {runs.map((r, i) => {
        const fill = palette[r.key];
        if (!fill) return null;
        return <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={fill} />;
      })}
    </svg>
  );
}
