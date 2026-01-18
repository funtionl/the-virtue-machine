import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { apiClient } from "@/lib/api";
import { rewritePositive } from "@/lib/rewriter";
import { useDebouncedCallback } from "use-debounce";

function Progress({ text, percentage }) {
  percentage = percentage ?? 0;
  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${percentage}%` }}>
        {text} ({`${percentage.toFixed(2)}%`})
      </div>
    </div>
  );
}

type HealthResponse = {
  status: string;
  timestamp: string;
};

const Dashboard = () => {
  const { user } = useUser();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [inputVal, setInputVal] = useState("");
  const [rewrittenVal, setRewrittenVal] = useState("");

  // Model loading
  const [ready, setReady] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  // Inputs and outputs
  const [output, setOutput] = useState("");

  const translate = () => {
    setDisabled(true);
    setOutput("");
    const prompt = `${inputVal}`;
    worker.current.postMessage({
      text: prompt,
    });
  };

  const worker = useRef<any>(null);
  // We use the `useEffect` hook to setup the worker as soon as the `App` component is mounted.
  useEffect(() => {
    // Create the worker if it does not yet exist.
    worker.current ??= new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });

    const onMessageReceived = (e) => {
      switch (e.data.status) {
        case "initiate":
          // Model file start load: add a new progress item to the list.
          setReady(false);
          setProgressItems((prev) => [...prev, e.data]);
          break;

        case "progress":
          // Model file progress: update one of the progress items.
          setProgressItems((prev) =>
            prev.map((item) => {
              if (item.file === e.data.file) {
                return { ...item, progress: e.data.progress };
              }
              return item;
            }),
          );
          break;

        case "done":
          // Model file loaded: remove the progress item from the list.
          setProgressItems((prev) =>
            prev.filter((item) => item.file !== e.data.file),
          );
          break;

        case "ready":
          // Pipeline ready: the worker is ready to accept messages.
          setReady(true);
          break;

        case "update":
          // Generation update: update the output text.
          setOutput((o) => o + e.data.output);
          break;

        case "complete":
          // Generation complete: re-enable the "Translate" button
          setDisabled(false);
          break;
      }
    };

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessageReceived);

    // Define a cleanup function for when the component is unmounted.
    return () =>
      worker.current.removeEventListener("message", onMessageReceived);
  });

  const debouncedRewrite = useDebouncedCallback(
    // function
    () => {
      translate();
    },
    // delay in ms
    1000,
  );

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    // Implement search functionality here

    setInputVal(query);

    debouncedRewrite();
  };

  useEffect(() => {
    let active = true;
    apiClient
      .get<HealthResponse>("/api/health")
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

      <label htmlFor="raw-post">Post</label>
      <input
        id="raw-post"
        type="text"
        value={inputVal}
        placeholder="What's in your mind?"
        onChange={handleChange}
        className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />

      <textarea
        value={output}
        readOnly
        className="w-full min-h-25 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 shadow-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />

      <div className="progress-bars-container">
        {ready === false && <label>Loading models... (only run once)</label>}
        {progressItems.map((data) => (
          <div key={data.file}>
            <Progress text={data.file} percentage={data.progress} />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6">
        <h3 className="text-lg font-semibold text-slate-900">API Connection</h3>
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
