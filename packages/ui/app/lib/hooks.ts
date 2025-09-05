"use client";

import type { EvalDetails, EvalSummary } from "@reval/core/types";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch data: ${res.status} ${errorText}`);
  }
  return res.json();
};

// Hook for fetching all evals with real-time polling
export function useEvals() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    evals: EvalSummary[];
  }>("/api/evals", fetcher, {
    refreshInterval: 10000, // Poll every 3 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 1000, // Dedupe requests within 1 second
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });

  return {
    evals: data?.evals || [],
    isLoading: isLoading || isValidating,
    isError: error,
    mutate,
  };
}

// Hook for fetching individual eval details with real-time polling
export function useEvalDetails(evalId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<EvalDetails>(
    evalId ? `/api/evals/${evalId}` : null,
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    },
  );

  return {
    evalData: data,
    isLoading: isLoading || isValidating,
    isError: error,
    mutate,
  };
}

// Hook for getting the latest eval ID
export function useLatestEval() {
  const { evals, isLoading, isError } = useEvals();

  const latestEval = evals.length > 0 ? evals[0] : null;

  return {
    latestEval,
    isLoading,
    isError,
  };
}
