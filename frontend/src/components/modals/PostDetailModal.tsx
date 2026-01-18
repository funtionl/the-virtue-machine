import { useEffect } from "react";
import type { Post } from "@/features/home/posts.api";

type Props = {
  post: Post;
  onClose: () => void;
};

const formatPostDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const PostDetailModal = ({ post, onClose }: Props) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:flex-row"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative w-full bg-slate-100 md:w-1/2">
          <img
            src={post.imageUrl}
            alt={post.content.slice(0, 80)}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex w-full flex-col gap-4 p-6 md:w-1/2">
          <header className="flex items-center gap-3">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.username}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-300" />
            )}
            <div>
              <p className="text-sm font-semibold">{post.author.username}</p>
              <p className="text-xs text-slate-500">
                {formatPostDate(post.createdAt)}
              </p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto text-sm text-slate-700">
            <p>{post.content}</p>
          </div>

          <footer className="flex items-center justify-between border-t pt-4 text-xs text-slate-500">
            <span>{post._count.comments} comments</span>
            <span>{post._count.reactions} reactions</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
