import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";

type HealthResponse = {
  status: string;
  timestamp: string;
};

const Dashboard = () => {
  const { user } = useUser();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .get<HealthResponse>("/api/v1/health")
      .then((response) => {
        if (active) {
          setHealth(response.data);
        }
      })
      .catch(() => {
        if (active) {
          setHealth(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-600">
          Welcome back
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">
          Hello{user?.firstName ? `, ${user.firstName}` : ""}!
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          This is your positivity dashboard. Start writing uplifting posts or
          explore the community feed once the backend is ready.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          API Connection
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          {loading
            ? "Checking the backend status..."
            : health
            ? `Connected · ${health.status} (${health.timestamp})`
            : "No response from the API yet."}
        </p>
      </div>
    </section>
  );
};

export default Dashboard;
