import { Router } from "express";
import healthRoutes from "./healthRoutes";
import uploadRoutes from "./uploadRoutes";
import userRoutes from "./userRoutes";
import postRoutes from "./postRoutes";

const router = Router();

router.use(healthRoutes);
router.use("/uploads", uploadRoutes);

router.use("/users", userRoutes);
router.use("/posts", postRoutes);

export default router;
