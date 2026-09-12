"use client";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { lazy, type ReactNode, Suspense } from "react";

const Devtools =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("@tanstack/react-query-devtools").then((module) => ({
          default: module.ReactQueryDevtools,
        })),
      )
    : null;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      {Devtools ? (
        <Suspense fallback={null}>
          <Devtools initialIsOpen={false} />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
}
