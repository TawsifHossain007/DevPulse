import bcrypt from "bcryptjs";
import type { IUser } from "./auth.interface";
import { pool } from "../../db";
import jwt from "jsonwebtoken";
import { config } from "../../config";

const signUpUserInDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  //check if user already exists
  const user = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email],
  );

  if (user.rows.length > 0) {
    throw new Error("User Already Exists");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
        INSERT INTO users (name,email,password,role) VALUES ($1, $2, $3, COALESCE($4,'contributor')) RETURNING *
        `,
    [name, email, hashPassword, role],
  );

  delete result.rows[0].password;
  return result;
};

const loginUserInDB = async (payload: IUser) => {
  const { email, password } = payload;

  //check if user exists
  const user = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email],
  );

  if (user.rows.length === 0) {
    throw new Error("User not found");
  }

  //check if password is valid or not
  const isValidPassword = await bcrypt.compare(password, user.rows[0].password);
  if (!isValidPassword) {
    throw new Error("Invalid password");
  }

  //generate token
  const jwtPayload = {
    id: user.rows[0].id,
    name: user.rows[0].name,
    email: user.rows[0].email,
    role: user.rows[0].role,
    created_at: user.rows[0].created_at,
    updated_at: user.rows[0].updated_at,
  };

  const token = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });

  return { token, user: jwtPayload };
};

export const authService = {
  signUpUserInDB,
  loginUserInDB,
};
