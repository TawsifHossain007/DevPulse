import { pool } from "../../db";
import type { IIssues } from "./issues.interface";

const createIssuesInDB = async(payload:IIssues) => {
    const {title, description, type, status,user_id} = payload;

    //check if user exists
    const user = await pool.query(`SELECT * FROM users WHERE id=$1`,[user_id])
    if (user.rows.length === 0) {
      throw new Error("User not found");
    }

    //check type
    const allowedTypes = ['bug', 'feature_req'];
    if (!allowedTypes.includes(type)) {
        throw new Error("Invalid type input.");
    }

    // 3. Check status (Only validate if the status was actually provided!)
    const allowedStatus = ['in_progress', 'open', 'resolved'];
    if (status && !allowedStatus.includes(status)) {
        throw new Error("Invalid status input.");
    }

    const result = await pool.query(`
        INSERT INTO issues (title, description, type, status, reporter_id) VALUES ($1, $2, $3, COALESCE($4,'open'), $5) RETURNING *`,
        [title, description,type,status,user_id],
    )

    return result;
}

export const issuesService = {
    createIssuesInDB
}