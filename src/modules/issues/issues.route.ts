import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post("/", auth(), issuesController.createIssues);

export const issuesRoute = router;