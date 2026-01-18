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

interface TranslateOptions {
  onUpdate?: (text: string) => void;
  onComplete?: (output: string) => void;
}

interface WorkerContextType {
  worker: Worker | null;
  ready: boolean;
  progressItems: ProgressItem[];
  translate: (text: string, options: TranslateOptions) => string;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const WorkerProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, TranslateOptions>>(new Map());

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
            const updateCallbacks = callbacksRef.current.get(e.data.requestId);
            if (updateCallbacks?.onUpdate) {
              updateCallbacks.onUpdate(e.data.output);
            }
            break;

          case "complete":
            const completeCallbacks = callbacksRef.current.get(
              e.data.requestId,
            );
            if (completeCallbacks?.onComplete) {
              completeCallbacks.onComplete(
                e.data.output?.[0]?.generated_text || "",
              );
            }
            callbacksRef.current.delete(e.data.requestId);
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

  const translate = (text: string, options: TranslateOptions) => {
    const newRequestId = crypto.randomUUID();
    callbacksRef.current.set(newRequestId, options);
    if (workerRef.current) {
      workerRef.current.postMessage({
        text,
        requestId: newRequestId,
      });
    }
    return newRequestId;
  };

  const value: WorkerContextType = {
    worker: workerRef.current,
    ready,
    progressItems,
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
