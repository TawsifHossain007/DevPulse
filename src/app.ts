import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { initDB } from "./db";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler";

const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

initDB();

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse Server",
    author: "Tawsif Hossain",
  });
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

app.use('/api/auth', authRoute);
app.use('/api/issues',issuesRoute);

export default app;