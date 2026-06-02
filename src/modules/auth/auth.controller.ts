import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";

const signUpUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.signUpUserInDB(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User Signed Up successfully",
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

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserInDB(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User Logged In successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

export const authController = {
  signUpUser,
  loginUser,
};
