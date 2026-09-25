import express from "express";
import routes from "./router.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./src/utils/ApiError.js";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send({ message: "Server is running" });
});

app.use("/api/v1", routes);

app.use((req, res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    statusCode,
    data: null,
    message: err.message || "Something went wrong",
    success: false,
    errors: err.errors || [],
  });
});

export default app;
