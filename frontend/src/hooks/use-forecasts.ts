import { useQuery } from "@tanstack/react-query";

import { getForecasts, type ForecastFilters } from "@/api/forecastApi";

export const forecastKey = ["forecasts"];

export function useForecasts(filters: ForecastFilters = {}) {
  return useQuery({
    queryKey: [...forecastKey, filters],
    queryFn: () => getForecasts(filters),
  });
}
