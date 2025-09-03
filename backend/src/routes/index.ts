import { Router, IRouter } from "express";
import transcriptionRoutes from "./transcription";
import userRoutes from "./users";
import authRoutes from "./auth";

const router: IRouter = Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/transcription", transcriptionRoutes);

// API Info endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Transcribe It API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      transcription: "/api/transcription",
    },
  });
});

export default router;
