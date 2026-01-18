import { Router } from "express";
import { requireClerkAuth } from "../middlewares/clerkAuth";
import { updateComment, deleteComment } from "../controllers/commentController";

const router = Router();

router.patch("/comments/:id", requireClerkAuth, updateComment);
router.delete("/comments/:id", requireClerkAuth, deleteComment);

export default router;
