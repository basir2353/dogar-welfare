import { useEffect, useState } from "react";
import { publicApi } from "@/utils/api";

type Impact = {
  totalRaised: number;
  activeCampaigns: number;
  uniqueDonors: number;
};

export function useImpact() {
  const [data, setData] = useState<Impact | null>(null);

  useEffect(() => {
    publicApi.get("/donations/impact").then((res) => {
      if (res.data.success) {
        setData(res.data.data);
      }
    }).catch(() => {
      setData(null);
    });
  }, []);

  return data;
}
