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
  likedByCurrentUser: boolean;
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

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  isAuthor?: boolean;
};

export type CommentsPage = {
  items: Comment[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
};

export const toggleReaction = async (
  postId: string,
  reactionType: "UP" | "DOWN" = "UP",
) => {
  const response = await apiClient.post(`/api/posts/${postId}/reactions`, {
    type: reactionType,
  });
  return response.data;
};

export const fetchCommentsForPost = async (
  postId: string,
  params?: {
    cursor?: string;
    limit?: number;
  },
) => {
  const response = await apiClient.get<CommentsPage>(
    `/api/posts/${postId}/comments`,
    {
      params,
    },
  );
  return response.data;
};

export const createCommentForPost = async (postId: string, content: string) => {
  const response = await apiClient.post<Comment>(
    `/api/posts/${postId}/comments`,
    {
      content,
    },
  );
  return response.data;
};
