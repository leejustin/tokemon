import type { SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  /** Optional small label shown before the value (e.g. "Sort:") */
  prefix?: string;
}

/**
 * Custom-styled select that hides the native chevron and renders a chevron icon
 * inside, with consistent dark-theme styling matching the rest of the app.
 */
export function Select({ options, value, onChange, prefix, className = "", ...rest }: Props) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pr-8 pl-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-ink-100 focus:outline-none focus:border-white/25 hover:bg-white/[0.07] cursor-pointer transition-colors"
        style={{ minWidth: 0 }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-canvas-panel text-ink-100">
            {prefix ? `${prefix} ${opt.label}` : opt.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Visually-hidden current value label for screen readers */}
      <span className="sr-only">{selected?.label}</span>
    </div>
  );
}
