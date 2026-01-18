import { Router } from "express";
import {
  getMe,
  syncMe,
  updateMe,
  getUserProfile,
} from "../controllers/userController";
import { requireClerkAuth } from "../middlewares/clerkAuth";

const router = Router();

router.get("/me", requireClerkAuth, getMe);

// This is not needed, clerk use webhooks to notify us of user creation/updates
router.post("/sync", requireClerkAuth, syncMe);
router.patch("/me", requireClerkAuth, updateMe);

router.get("/:id", getUserProfile);

export default router;
