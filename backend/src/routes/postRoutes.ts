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
  togglePostReaction,
} from "../controllers/postController";
import {
  deleteMyReactionForPost,
  getMyReactionForPost,
  upsertReactionForPost,
} from "../controllers/reactionController";

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

// reactions under a post ✅ (becomes /posts/:id/reaction)
router.get("/:id/reaction", requireClerkAuth, getMyReactionForPost);
router.put("/:id/reaction", requireClerkAuth, upsertReactionForPost);

// reactions ✅ (toggle thumbs up, becomes /posts/:id/reactions)
router.post("/:id/reactions", requireClerkAuth, togglePostReaction);
router.delete("/:id/reactions", requireClerkAuth, togglePostReaction);

export default router;
