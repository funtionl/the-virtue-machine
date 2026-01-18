import { useEffect, useState, useRef, useCallback } from "react";
import { Send, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Post, Comment } from "@/features/home/posts.api";
import {
  fetchPostById,
  fetchCommentsForPost,
  createCommentForPost,
  toggleReaction,
} from "@/features/home/posts.api";
import { useWorker } from "@/providers/WorkerProvider";
import CommentItem from "@/features/home/components/CommentItem";

type Props = {
  postId: string;
  onClose: () => void;
  onPostUpdate?: (post: Post) => void;
};

const formatPostDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const PostDetailModal = ({ postId, onClose, onPostUpdate }: Props) => {
  const [post, setPost] = useState<Post | null>(null);
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [reactionsCount, setReactionsCount] = useState(0);
  const [isReactionLoading, setIsReactionLoading] = useState(false);
  const { output, ready, translate } = useWorker();
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  // Load post data
  useEffect(() => {
    const loadPost = async () => {
      try {
        setIsPostLoading(true);
        const data = await fetchPostById(postId);
        setPost(data);
        setIsLiked(data.likedByCurrentUser);
        setReactionsCount(data._count.reactions);
      } catch (error) {
        console.error("Failed to load post:", error);
      } finally {
        setIsPostLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  // Load initial comments
  useEffect(() => {
    if (!post) return;

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
  }, [post]);

  // Load more comments when scrolling to bottom
  const loadMoreComments = useCallback(async () => {
    if (!post || !hasMoreComments || isLoadingComments || !nextCursor) return;

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
  }, [post, nextCursor, hasMoreComments, isLoadingComments]);

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

    if (!post || !commentInput.trim() || isSubmitting || isRewriting) return;

    try {
      // Rewrite the comment first
      setIsRewriting(true);
      translate(commentInput.trim());
      // Wait for rewriting to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsRewriting(false);

      setIsSubmitting(true);
      const newComment = await createCommentForPost(
        post.id,
        output || commentInput.trim(),
      );
      setComments((prev) => [newComment, ...prev]);
      setCommentInput("");
      // Scroll to top to see the new comment
      commentsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
      setIsRewriting(false);
    }
  };

  const handlePostThumbsUp = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!post || isReactionLoading) return;

    try {
      setIsReactionLoading(true);
      await toggleReaction(post.id);
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);

      let newReactionsCount = reactionsCount;
      if (isLiked) {
        newReactionsCount = Math.max(0, reactionsCount - 1);
        setReactionsCount(newReactionsCount);
      } else {
        newReactionsCount = reactionsCount + 1;
        setReactionsCount(newReactionsCount);
      }

      // Notify parent of post update
      if (onPostUpdate && post) {
        onPostUpdate({
          ...post,
          likedByCurrentUser: newLikedState,
          _count: {
            ...post._count,
            reactions: newReactionsCount,
          },
        });
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    } finally {
      setIsReactionLoading(false);
    }
  };

  const handlePostThumbsDown = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!post || isReactionLoading) return;

    if (!isLiked) {
      try {
        setIsReactionLoading(true);
        await toggleReaction(post.id);
        setIsLiked(true);
        const newReactionsCount = reactionsCount + 1;
        setReactionsCount(newReactionsCount);

        // Notify parent of post update
        if (onPostUpdate && post) {
          onPostUpdate({
            ...post,
            likedByCurrentUser: true,
            _count: {
              ...post._count,
              reactions: newReactionsCount,
            },
          });
        }
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

  if (isPostLoading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <div className="rounded-2xl bg-white p-8">
          <p className="text-slate-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <div className="rounded-2xl bg-white p-8">
          <p className="text-slate-600">Failed to load post</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl md:flex-row"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex items-center justify-center w-full bg-slate-100 md:w-1/2 overflow-y-auto">
          <img
            src={post.imageUrl}
            alt={post.content.slice(0, 80)}
            className="max-h-full w-full object-contain p-4"
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
              disabled={isSubmitting || isRewriting}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || isSubmitting || isRewriting}
              className="rounded-lg bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center min-w-10"
            >
              {isRewriting ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
