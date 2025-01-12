"use client";

import { useState, useEffect, useCallback } from "react";
import FermentablesTable from "@/components/fermentables-table";
import HopsTable from "@/components/hops-table";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import {
  getBatchesWithFermentables,
  getFermentables,
  getHops,
} from "@/lib/brewfather";

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [fermentablesInventory, setFermentablesInventory] = useState<any[]>([]);
  const [hopsInventory, setHopsInventory] = useState<any[]>([]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("brewfatherUserId");
    const storedApiKey = localStorage.getItem("brewfatherApiKey");
    if (storedUserId && storedApiKey) {
      setUserId(storedUserId);
      setApiKey(storedApiKey);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId || !apiKey) return;

    const batchesData = await getBatchesWithFermentables(userId, apiKey);
    const fermentablesData = await getFermentables(userId, apiKey);
    const hopsData = await getHops(userId, apiKey);

    setBatches(batchesData);
    setFermentablesInventory(fermentablesData);
    setHopsInventory(hopsData);
  }, [userId, apiKey]);

  useEffect(() => {
    if (userId && apiKey) {
      fetchData();
    }
  }, [userId, apiKey, fetchData]);

  const handleSaveApiKey = (newUserId: string, newApiKey: string) => {
    localStorage.setItem("brewfatherUserId", newUserId);
    localStorage.setItem("brewfatherApiKey", newApiKey);
    setUserId(newUserId);
    setApiKey(newApiKey);
  };

  return (
    <div className="p-10 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Brewfather Dashboard</h1>
        <ApiKeyDialog onSave={handleSaveApiKey} />
      </div>
      {userId && apiKey ? (
        <>
          <FermentablesTable
            fermentablesInventory={fermentablesInventory}
            batches={batches}
          />
          <HopsTable hopsInventory={hopsInventory} batches={batches} />
        </>
      ) : (
        <div className="text-center py-10">
          <p>
            Please set your Brewfather User ID and API Key to view the
            dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
