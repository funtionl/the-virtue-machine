import { useNavigate, useParams } from "react-router-dom";
import CommentModal from "@/components/modals/CommentModal";

const PostDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  if (!id) return null;

  return <CommentModal postId={id} onClose={() => navigate(-1)} />;
};

export default PostDetail;
