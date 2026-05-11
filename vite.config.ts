import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * GitHub Project Pages serves at `https://<user>.github.io/<repo>/`.
 * CI sets `VITE_BASE_PATH` to `/<repo>/` so hashed asset URLs resolve.
 * Local `npm run dev` / `npm run build` omit it → base `/`.
 *
 * When you point a custom apex domain at Pages, the site is served at `/`;
 * set `VITE_BASE_PATH: "/"` in `.github/workflows/deploy-pages.yml` then.
 */
function pagesBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim();
  if (!raw) return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.endsWith("/") ? withSlash : `${withSlash}/`;
}

export default defineConfig({
  base: pagesBase(),
  plugins: [react()],
  server: {
    port: 4201,
    strictPort: true,
  },
});
