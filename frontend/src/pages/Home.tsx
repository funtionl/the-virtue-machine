import { useEffect, useMemo, useState } from "react";
import PostCard from "@/features/home/components/PostCard";
import PostDetailModal from "@/features/home/components/PostDetailModal";
import PostComposeModal from "@/components/modals/PostComposeModal";
import { fetchAllPosts, type Post } from "@/features/home/posts.api";

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allPosts = await fetchAllPosts();
        if (!isActive) return;
        setPosts(allPosts);
      } catch {
        if (!isActive) return;
        setError("Could not load posts. Please try again.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadPosts();
    return () => {
      isActive = false;
    };
  }, []);

  const sortedPosts = useMemo(() => {
    return [...posts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [posts]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
      <div className="mb-6">
        <button
          onClick={() => setIsComposeOpen(true)}
          className="w-full rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600"
        >
          Create Post
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500">
          Loading posts...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="columns-1 gap-x-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {sortedPosts.map((post) => (
            <div key={post.id} className="mb-6 break-inside-avoid">
              <PostCard post={post} onOpen={setSelectedPost} />
            </div>
          ))}
        </div>
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {isComposeOpen && (
        <PostComposeModal
          onClose={() => setIsComposeOpen(false)}
          onPostCreated={() => {
            setIsComposeOpen(false);
            // Reload posts
            const loadPosts = async () => {
              try {
                const allPosts = await fetchAllPosts();
                setPosts(allPosts);
              } catch {
                setError("Could not reload posts after creating new post.");
              }
            };
            loadPosts();
          }}
        />
      )}
    </div>
  );
};

export default Home;
