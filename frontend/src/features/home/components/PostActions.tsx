import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toggleReaction } from "@/features/home/posts.api";

type PostActionsProps = {
  postId: string;
  thumbsUpCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
};

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return count.toString();
};

const PostActions = ({
  postId,
  thumbsUpCount,
  commentsCount,
  likedByCurrentUser,
}: PostActionsProps) => {
  const [isLiked, setIsLiked] = useState(likedByCurrentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThumbsUpCount, setCurrentThumbsUpCount] =
    useState(thumbsUpCount);

  const handleThumbsUp = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLoading) return;

    try {
      setIsLoading(true);
      await toggleReaction(postId);
      setIsLiked(!isLiked);

      // Update thumbs up count based on current like state
      if (isLiked) {
        // Currently liked, so decrement
        setCurrentThumbsUpCount((prev) => Math.max(0, prev - 1));
      } else {
        // Currently not liked, so increment
        setCurrentThumbsUpCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThumbsDown = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isLoading) return;

    // Only proceed if not already liked
    if (!isLiked) {
      try {
        setIsLoading(true);
        await toggleReaction(postId);
        setIsLiked(true);
        setCurrentThumbsUpCount((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to toggle reaction:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="mt-4 flex gap-4 justify-between"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={handleThumbsUp}
          disabled={isLoading}
          className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <ThumbsUp
            size={20}
            className={`transition-all duration-200 ${
              isLiked ? "text-blue-500" : "text-slate-600"
            }`}
          />
        </button>
        <span className="text-sm text-slate-600">
          {formatCount(currentThumbsUpCount)}
        </span>
      </div>

      <div className="flex items-center gap-2 ">
        <button
          className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
          onClick={handleThumbsDown}
        >
          <ThumbsDown size={20} />
        </button>
        <span className="text-sm text-slate-600">0</span>
      </div>

      <div className="flex items-center gap-2">
        <button>
          <MessageCircle size={20} />
        </button>
        <span className="text-sm text-slate-600">
          {formatCount(commentsCount)}
        </span>
      </div>
    </div>
  );
};

export default PostActions;
