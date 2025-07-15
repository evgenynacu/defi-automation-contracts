import { useEffect, useState } from "react";
import { Strategy } from "@/types";
import { API_BASE_URL } from "@/lib/env"

type StrategiesState = {
  strategies: Strategy[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useStrategies(): StrategiesState {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/strategies`);

      if (!response.ok) {
        console.error('Error fetching strategies:', response.status);
        setError('Failed to load strategies');
        return
      }

      const data = await response.json();
      // Преобразуем строковые даты в объекты Date
      const strategiesWithDates = data.map((strategy: any) => ({
        ...strategy,
        lastUpdated: new Date(strategy.lastUpdated)
      }));

      setStrategies(strategiesWithDates);
      setError(null);
    } catch (err) {
      console.error('Error fetching strategies:', err);
      setError('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  return {
    strategies,
    loading,
    error,
    refetch: fetchStrategies
  };
}
