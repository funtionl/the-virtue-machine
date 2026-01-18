import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ProgressItem {
  file?: string;
  progress?: number;
  status?: string;
}

interface WorkerContextType {
  worker: Worker | null;
  ready: boolean;
  disabled: boolean;
  output: string;
  progressItems: ProgressItem[];
  setOutput: (value: string) => void;
  translate: (text: string) => void;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [output, setOutput] = useState("");
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../worker.js", import.meta.url), {
        type: "module",
      });

      const onMessageReceived = (e: MessageEvent) => {
        switch (e.data.status) {
          case "initiate":
            setReady(false);
            setProgressItems((prev) => [...prev, e.data]);
            break;

          case "progress":
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
            setProgressItems((prev) =>
              prev.filter((item) => item.file !== e.data.file),
            );
            break;

          case "ready":
            setReady(true);
            break;

          case "update":
            setOutput((o) => o + e.data.output);
            break;

          case "complete":
            setDisabled(false);
            break;
        }
      };

      workerRef.current.addEventListener("message", onMessageReceived);
    }

    return () => {
      if (workerRef.current) {
        // Cleanup is handled by keeping the worker alive for reuse
      }
    };
  }, []);

  const translate = (text: string) => {
    setDisabled(true);
    setOutput("");
    if (workerRef.current) {
      workerRef.current.postMessage({
        text,
      });
    }
  };

  const value: WorkerContextType = {
    worker: workerRef.current,
    ready,
    disabled,
    output,
    progressItems,
    setOutput,
    translate,
  };

  return (
    <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>
  );
};

export const useWorker = () => {
  const context = useContext(WorkerContext);
  if (!context) {
    throw new Error("useWorker must be used within WorkerProvider");
  }
  return context;
};
