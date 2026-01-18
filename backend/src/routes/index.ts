import { Router } from "express";
import healthRoutes from "./healthRoutes";
import uploadRoutes from "./uploadRoutes";
import userRoutes from "./userRoutes";
import postRoutes from "./postRoutes";
import webhookRoutes from "./webhookRoutes";

const router = Router();

router.use(healthRoutes);
router.use("/uploads", uploadRoutes);

router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/webhooks", webhookRoutes);

export default router;
