// import app from "./app.js";

// const PORT = process.env.PORT || 8000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import labRoutes from "./routes/labRoutes.js";
import ctfRoutes from "./routes/ctfRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import authenticateToken from "./middleware/authMiddleware.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { swaggerSpec, swaggerUi, swaggerOptions } from "./config/swagger.js";
// import { ipnHandler } from "./controllers/paymentController.js";
dotenv.config();
const app = express();

// Allow all CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false,
  })
);

// app.post(
//   "/api/payment/notify",
//   express.raw({ type: "application/json" }), // Dùng raw parser
//   ipnHandler // Gọi thẳng vào handler
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Xử lý các yêu cầu preflight cho tất cả các route
// app.options("/*", cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", authenticateToken, userRoutes);
app.use("/api/courses", authenticateToken, courseRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/ctf", ctfRoutes);
app.use("/api/chatbot", authenticateToken, chatbotRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/upload", authenticateToken, uploadRoutes);

// Route test cần token
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({
    message: `Xin chào ${req.user.username}, bạn đã vào route bảo vệ!`,
  });
});

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy route" });
});

// Xử lý lỗi server
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Lỗi server" });
});

// Vercel yêu cầu export default để hoạt động như một serverless function
export default app;

// Start server when running directly (not in Vercel)
// Vercel sets VERCEL env variable, so we only start server when not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}
