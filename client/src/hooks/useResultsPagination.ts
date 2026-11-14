import { useEffect, useState } from "react";
import { getAllResults } from "../services/resultService";
import type { Result } from "../types/result";

function useResultsPagination() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [results, setResults] = useState<Result[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const limit = 10;

  useEffect(() => {
    const fetchRes = async () => {
      try {
        const res = await getAllResults(page, limit);

        const newTotalPages = res.pagination.totalPages;
        if (page > newTotalPages && newTotalPages > 0) {
          setPage(newTotalPages);
          return;
        }

        if (res.message) {
          setResults(res.results);
          setTotalPages(res.pagination.totalPages);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Sessions loading failed",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchRes();
  }, [page, refreshKey]);

  const refetch = () => {
    setRefreshKey((current: number) => current + 1);
  };

  return {
    results,
    page,
    error,
    isLoading,
    totalPages,
    setPage,
    refetch,
  };
}

export default useResultsPagination;
