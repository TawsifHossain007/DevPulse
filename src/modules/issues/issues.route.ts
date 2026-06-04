import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post("/", auth(), issuesController.createIssues);
router.get("/", issuesController.getAllIssues);
router.get("/:id",issuesController.getSingleIssue)
router.put("/:id", auth("maintainer","contributor"), issuesController.updateIssue);
router.delete("/:id", auth("maintainer"), issuesController.deleteIssue);

export const issuesRoute = router;