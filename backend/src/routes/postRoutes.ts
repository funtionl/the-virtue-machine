import { Router } from "express";
import { requireClerkAuth } from "../middlewares/clerkAuth";
import {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  listCommentsForPost,
  createCommentForPost,
} from "../controllers/postController";

const router = Router();

// public feed + detail
router.get("/", listPosts);
router.get("/:id", getPostById);

// protected CRUD
router.post("/", requireClerkAuth, createPost);
router.patch("/:id", requireClerkAuth, updatePost);
router.delete("/:id", requireClerkAuth, deletePost);

// comments under a post ✅ (becomes /posts/:id/comments)
router.get("/:id/comments", listCommentsForPost);
router.post("/:id/comments", requireClerkAuth, createCommentForPost);

export default router;
