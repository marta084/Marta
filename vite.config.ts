import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { flatRoutes } from 'remix-flat-routes'
/** @type {import('@remix-run/dev/dist/vite/plugin').VitePluginConfig} */

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy(),
    remix({
      ignoredRouteFiles: ['**/*'],
	serverModuleFormat: 'esm',
	future: {
		v3_fetcherPersist: true,
		v3_relativeSplatPath: true,
		v3_throwAbortReason: true,
	},
	ssr: true,
	routes: async defineRoutes => {
		return flatRoutes('routes', defineRoutes, {
			ignoredRouteFiles: ['**/*.test.{js,jsx,ts,tsx}', '**/__*.*'],
		})
	},
    }),
    tsconfigPaths(),
  ],
});
