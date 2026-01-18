import { useEffect, useState, useRef, useCallback } from "react";
import { Send, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Post, Comment } from "@/features/home/posts.api";
import {
  fetchCommentsForPost,
  createCommentForPost,
  toggleReaction,
} from "@/features/home/posts.api";
import CommentItem from "@/features/home/components/CommentItem";

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(post.likedByCurrentUser);
  const [reactionsCount, setReactionsCount] = useState(post._count.reactions);
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Load initial comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoadingComments(true);
        const data = await fetchCommentsForPost(post.id, { limit: 20 });
        setComments(data.items);
        setNextCursor(data.pageInfo.nextCursor);
        setHasMoreComments(data.pageInfo.hasNextPage);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    loadComments();
  }, [post.id]);

  // Load more comments when scrolling to bottom
  const loadMoreComments = useCallback(async () => {
    if (!hasMoreComments || isLoadingComments || !nextCursor) return;

    try {
      setIsLoadingComments(true);
      const data = await fetchCommentsForPost(post.id, {
        cursor: nextCursor,
        limit: 20,
      });
      setComments((prev) => [...prev, ...data.items]);
      setNextCursor(data.pageInfo.nextCursor);
      setHasMoreComments(data.pageInfo.hasNextPage);
    } catch (error) {
      console.error("Failed to load more comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [post.id, nextCursor, hasMoreComments, isLoadingComments]);

  const handleScroll = useCallback(() => {
    if (!commentsContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      commentsContainerRef.current;

    // Load more when scrolled near bottom (within 500px)
    if (scrollHeight - (scrollTop + clientHeight) < 500) {
      loadMoreComments();
    }
  }, [loadMoreComments]);

  useEffect(() => {
    const container = commentsContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentInput.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newComment = await createCommentForPost(post.id, commentInput);
      setComments((prev) => [newComment, ...prev]);
      setCommentInput("");
      // Scroll to top to see the new comment
      commentsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostThumbsUp = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isReactionLoading) return;

    try {
      setIsReactionLoading(true);
      await toggleReaction(post.id);
      setIsLiked(!isLiked);

      if (isLiked) {
        setReactionsCount((prev) => Math.max(0, prev - 1));
      } else {
        setReactionsCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    } finally {
      setIsReactionLoading(false);
    }
  };

  const handlePostThumbsDown = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isReactionLoading) return;

    if (!isLiked) {
      try {
        setIsReactionLoading(true);
        await toggleReaction(post.id);
        setIsLiked(true);
        setReactionsCount((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to toggle reaction:", error);
      } finally {
        setIsReactionLoading(false);
      }
    }
  };

  const handleCommentReactionToggle = async (
    commentId: string,
    reactionType: "UP" | "DOWN",
  ) => {
    // This would call a comment reaction API if it existed
    // For now, reactions on comments are just UI-only
    console.log(`Comment ${commentId} reaction: ${reactionType}`);
  };

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

        <div className="flex w-full flex-col gap-0 md:w-1/2">
          <header className="flex items-center gap-3 border-b p-6 pb-4">
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

          <div className="space-y-4 border-b p-6 pb-4">
            <p className="text-sm text-slate-700">{post.content}</p>
            <div className="flex items-center gap-6 pt-2">
              <button
                onClick={handlePostThumbsUp}
                disabled={isReactionLoading}
                className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <ThumbsUp
                  size={18}
                  className={`transition-all duration-200 ${
                    isLiked ? "text-blue-500" : "text-slate-600"
                  }`}
                />
                <span className="text-xs text-slate-600">{reactionsCount}</span>
              </button>
              <button
                onClick={handlePostThumbsDown}
                disabled={isReactionLoading}
                className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <ThumbsDown size={18} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto p-4"
          >
            {isLoadingComments && comments.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-slate-500">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-slate-500">No comments yet</p>
              </div>
            ) : (
              <div className="space-y-0">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReactionToggle={handleCommentReactionToggle}
                  />
                ))}
                {isLoadingComments && (
                  <div className="py-3 text-center">
                    <p className="text-xs text-slate-500">
                      Loading more comments...
                    </p>
                  </div>
                )}
                {!hasMoreComments && comments.length > 0 && (
                  <div className="py-3 text-center">
                    <p className="text-xs text-slate-400">No more comments</p>
                  </div>
                )}
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment Input */}
          <form
            onSubmit={handleSubmitComment}
            className="border-t p-4 flex gap-2"
          >
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || isSubmitting}
              className="rounded-lg bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
