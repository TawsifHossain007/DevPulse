import type { NextFunction, Request, Response } from "express";
import { config } from "../config";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { pool } from "../db";
import type { ROLES } from "../types";


const auth = (...roles: ROLES[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const decoded = jwt.verify(
        token as string,
        config.secret as string,
      ) as JwtPayload;

      const userData = await pool.query("SELECT * FROM users WHERE email=$1", [
        decoded.email,
      ]);

      const user = userData.rows[0];

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      //check role
      if(roles.length > 0 && !roles.includes(user.role)){
        return res.status(403).json({ success: false, message: "Forbidden, Role not allowed" });
      }

      req.user = decoded;

      next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  };
};

export default auth;