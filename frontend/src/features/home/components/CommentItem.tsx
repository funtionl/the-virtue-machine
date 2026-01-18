import type { Comment } from "@/features/home/posts.api";

type CommentItemProps = {
  comment: Comment;
  onReactionToggle?: (commentId: string, reactionType: "UP" | "DOWN") => void;
};

const formatCommentDate = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 0) return `${seconds}s ago`;
  return "now";
};

const CommentItem = ({ comment }: CommentItemProps) => {
  return (
    <div className="border-b py-3 last:border-b-0">
      <div className="flex gap-3">
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.username}
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-slate-300 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{comment.author.username}</p>
            <p className="text-xs text-slate-500">
              {formatCommentDate(comment.createdAt)}
            </p>
          </div>

          <p className="mt-1 text-sm text-slate-700 wrap-break-word">
            {comment.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
