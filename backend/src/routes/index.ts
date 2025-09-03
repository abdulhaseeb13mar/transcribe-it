import { Router, IRouter } from "express";
import userRoutes from "./users";
import authRoutes from "./auth";
import adminRoutes from "./admin";

const router: IRouter = Router();

// API Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

// API Info endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Transcribe It API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      admin: "/api/admin",
    },
  });
});

export default router;
