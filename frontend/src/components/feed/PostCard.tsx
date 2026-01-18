import PostActions from "./PostActions";
import PostComments from "./PostComments";
import type { Post } from "@/features/home/posts.api";

type Props = {
  post: Post;
  onOpen: (post: Post) => void;
};

const formatPostDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const PostCard = ({ post, onOpen }: Props) => {
  return (
    <article
      className="cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
      onClick={() => onOpen(post)}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
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
          <p className="font-medium">{post.author.username}</p>
          <p className="text-xs text-slate-500">
            {formatPostDate(post.createdAt)}
          </p>
        </div>
      </div>

      {/* Media */}
      <img
        src={post.imageUrl}
        alt={post.content.slice(0, 60)}
        className="mb-4 aspect-square w-full rounded-lg object-cover"
        loading="lazy"
      />

      <p className="line-clamp-3 text-sm text-slate-700">{post.content}</p>

      {/* Actions */}
      <PostActions postId={post.id} />

      {/* Comments */}
      <PostComments postId={post.id} />
    </article>
  );
};

export default PostCard;
