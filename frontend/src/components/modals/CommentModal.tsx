import { useEffect, useState } from "react";
import { useWorker } from "@/providers/WorkerProvider";

type Props = {
  onClose: () => void;
  postId: string;
};

const CommentModal = ({ onClose, postId }: Props) => {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const { ready, translate } = useWorker();

  // ESC key handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      return;
    }

    try {
      // Rewrite the comment first
      setIsRewriting(true);
      translate(comment.trim(), {
        onUpdate: () => {}, // Ignore streaming updates
        onComplete: async (output) => {
          setIsRewriting(false);
          setIsSubmitting(true);
          try {
            // TODO: Wire to actual comment API
            console.log("Posting comment:", output || comment.trim());
            setComment("");
          } finally {
            setIsSubmitting(false);
          }
        },
      });
    } catch (err) {
      console.error("Failed to post comment:", err);
      setIsRewriting(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-[900px] overflow-hidden rounded-xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media */}
        <div className="hidden w-1/2 bg-slate-200 md:block" />

        {/* Comments */}
        <div className="flex w-full flex-col md:w-1/2">
          <header className="border-b p-4 font-medium">Comments</header>

          <section className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
            <p>
              <b>user1</b> amazing
            </p>
            <p>
              <b>user2</b> 🔥🔥🔥
            </p>
          </section>

          <footer className="border-t p-3">
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                disabled={isSubmitting || isRewriting}
              />
              <button
                type="submit"
                disabled={isSubmitting || isRewriting || !comment.trim()}
                className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
              >
                {isRewriting ? (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : null}
                {isRewriting ? "..." : "Post"}
              </button>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
