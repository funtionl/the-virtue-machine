import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const PostActions = ({ postId }: { postId: number }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mt-3 flex gap-4">
      <button>
        <ThumbsUp size={20} />
      </button>
      <button>
        <ThumbsDown size={20} />
      </button>

      <button
        onClick={() =>
          navigate(`/post/${postId}`, {
            state: { background: location },
          })
        }
      >
        <MessageCircle size={20} />
      </button>
    </div>
  );
};

export default PostActions;
