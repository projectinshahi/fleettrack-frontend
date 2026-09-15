"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDashboardStats,
  getActiveVehicles,
  getTripSummary,
  getDeliveryMetrics,
  getWeeklyActivity,
} from "@/services/dashboard.service";

import {
  TripSummary,
  DeliveryMetrics,
  WeeklyActivityDay,
} from "@/types/trip";
import { useClientStore } from "@/store/client-store";

export function useDashboard() {
  const { selectedClient } =
    useClientStore();

  const [stats, setStats] =
    useState<Record<string, unknown> | null>(null);

  const [vehicles, setVehicles] =
    useState<Record<string, unknown>[]>([]);

  const [tripSummary, setTripSummary] =
    useState<TripSummary | null>(null);

  const [deliveryMetrics, setDeliveryMetrics] =
    useState<DeliveryMetrics | null>(null);

  const [weeklyActivity, setWeeklyActivity] =
    useState<WeeklyActivityDay[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const clientId = selectedClient?.id;

  // The five calls are independent — five endpoints, five independent states — so they
  // run concurrently instead of in a chain. Same fail-fast behaviour as before: one
  // shared catch, so any failure still sets the single `error` flag.
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const [statsData, vehicleData, summaryData, metricsData, weeklyData] =
        await Promise.all([
          getDashboardStats(clientId),
          getActiveVehicles(clientId),
          getTripSummary(clientId),
          getDeliveryMetrics(clientId),
          getWeeklyActivity(clientId),
        ]);

      setStats(statsData.data);
      setVehicles(vehicleData.data || []);
      setTripSummary(summaryData.data);
      setDeliveryMetrics(metricsData.data);
      setWeeklyActivity(weeklyData.data?.days ?? []);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Initial load + reload when the scoped client changes. Inlined (not a call to
  // `load`) to satisfy the no-setState-in-effect lint rule, mirroring use-trips.
  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(false);

        const [statsData, vehicleData, summaryData, metricsData, weeklyData] =
          await Promise.all([
            getDashboardStats(clientId),
            getActiveVehicles(clientId),
            getTripSummary(clientId),
            getDeliveryMetrics(clientId),
            getWeeklyActivity(clientId),
          ]);

        if (!active) return;

        setStats(statsData.data);
        setVehicles(vehicleData.data || []);
        setTripSummary(summaryData.data);
        setDeliveryMetrics(metricsData.data);
        setWeeklyActivity(weeklyData.data?.days ?? []);
      } catch (err) {
        console.error(err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [clientId]);

  return {
    stats,
    vehicles,
    tripSummary,
    deliveryMetrics,
    weeklyActivity,
    loading,
    error,
    reload: load,
  };
}