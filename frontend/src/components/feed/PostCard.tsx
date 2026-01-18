import PostActions from "./PostActions";
import PostComments from "./PostComments";

const PostCard = ({ postId }: { postId: number }) => {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-300" />
        <div>
          <p className="font-medium">username</p>
          <p className="text-xs text-slate-500">2 hours ago</p>
        </div>
      </div>

      {/* Media */}
      <div className="mb-4 aspect-square rounded-lg bg-slate-200" />

      {/* Actions */}
      <PostActions postId={postId} />

      {/* Comments */}
      <PostComments postId={postId} />
    </article>
  );
};

export default PostCard;
