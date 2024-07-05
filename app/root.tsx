// app/root.tsx
import type { LinksFunction } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect } from "react";
import { Workbox } from "workbox-window";
import tailwindStyleSheet from '~/assets/css/tailwind.css?url'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: tailwindStyleSheet },
];

export default function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const wb = new Workbox("/service-worker.js");
      wb.register();
    }
  }, []);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}