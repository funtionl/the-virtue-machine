import { apiClient } from "@/lib/api";

export type PostAuthor = {
  id: string;
  username: string;
  avatarUrl: string;
};

export type PostCounts = {
  comments: number;
  reactions: number;
};

export type Post = {
  id: string;
  imageUrl: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  _count: PostCounts;
};

export type PostsPage = {
  items: Post[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
};

export const fetchPostsPage = async (params?: {
  cursor?: string;
  limit?: number;
}) => {
  const response = await apiClient.get<PostsPage>("/api/posts", {
    params,
  });

  return response.data;
};

export const fetchAllPosts = async (limit = 25) => {
  const collected: Post[] = [];
  let cursor: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await fetchPostsPage({ cursor, limit });
    collected.push(...page.items);
    cursor = page.pageInfo.nextCursor ?? undefined;
    hasNextPage = page.pageInfo.hasNextPage;
  }

  return collected;
};

export const createPost = async (data: {
  content: string;
  imageUrl?: string;
}) => {
  const response = await apiClient.post<Post>("/api/posts", data);
  return response.data;
};
