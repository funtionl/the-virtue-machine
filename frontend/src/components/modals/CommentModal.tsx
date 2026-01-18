import { useEffect } from "react";

type Props = {
  onClose: () => void;
  postId: string;
};

const CommentModal = ({ onClose, postId }: Props) => {
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
            <input
              placeholder="Add a comment..."
              className="w-full rounded-lg border px-3 py-2"
            />
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
