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
router.post("/sync", requireClerkAuth, syncMe);
router.patch("/me", requireClerkAuth, updateMe);

router.get("/:id", getUserProfile);

export default router;
