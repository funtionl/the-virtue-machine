const PostComments = ({ postId }: { postId: number }) => {
  return (
    <div className="mt-3 space-y-1 text-sm">
      <p>
        <span className="font-medium">user1</span> nice 🔥
      </p>
      <p>
        <span className="font-medium">user2</span> love this
      </p>
      <p className="cursor-pointer text-slate-500">View all comments</p>
    </div>
  );
};

export default PostComments;
