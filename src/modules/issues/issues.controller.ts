import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import sendResponse from "../../utility/sendResponse";

const createIssues = async (req: Request, res: Response) => {
  try {
    const payload = {
    ...req.body,
    user_id: req.user.id
  };
    const result = await issuesService.createIssuesInDB(payload);
    
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue Created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Error inserting data",
      error: error.message,
    });
  }
};

export const issuesController = {
  createIssues,
};
