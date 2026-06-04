import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type { IIssues } from "./issues.interface";

const createIssuesInDB = async (payload: IIssues) => {
  const { title, description, type, status, user_id } = payload;

  //check type
  const allowedTypes = ["bug", "feature_request"];
  if (!allowedTypes.includes(type)) {
    throw new Error("Invalid type input.");
  }

  // 3. Check status (Only validate if the status was actually provided!)
  const allowedStatus = ["in_progress", "open", "resolved"];
  if (status && !allowedStatus.includes(status)) {
    throw new Error("Invalid status input.");
  }

  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, status, reporter_id) 
    VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) 
    RETURNING *`,
    [title, description, type, status, user_id],
  );

  return result;
};

const getAllIssuesFromDB = async () => {
  const result = await pool.query(`SELECT * FROM issues`);

  if (result.rows.length === 0) {
    throw new Error("No issues found");
  }

  const issues = result.rows;

  // Batch fetch all reporters in a single query
  const reporterIds = issues.map((issue) => issue.reporter_id);
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  // Map reporters by id for quick lookup
  const reporterMap = reporterResult.rows.reduce(
    (acc, reporter) => {
      acc[reporter.id] = reporter;
      return acc;
    },
    {} as Record<number, any>,
  );

  // Attach reporter to each issue
  return issues.map((issue) => ({
    ...issue,
    reporter: reporterMap[issue.reporter_id] ?? null,
  }));
};

const getSingleIssueFromDB = async (id: string) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  // Separate query to fetch reporter using reporter_id
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );

  const reporter = reporterResult.rows[0] ?? null;

  return { ...issue, reporter };
};

const updateIssueInDB = async (payload: Partial<IIssues>, id: string, user: JwtPayload) => {

    // First fetch the existing issue
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

    // Contributor restrictions
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can only update your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("You can only update issues that are open");
    }
  }

  const { title, description, type, status } = payload;

  // Check type
  const allowedTypes = ["bug", "feature_request"];
  if (type && !allowedTypes.includes(type)) {
    throw new Error("Invalid type input.");
  }

  // Check status
  const allowedStatus = ["in_progress", "open", "resolved"];
  if (status && !allowedStatus.includes(status)) {
    throw new Error("Invalid status input.");
  }

  const result = await pool.query(
    `
    UPDATE issues 
    SET title = COALESCE($1, title), 
        description = COALESCE($2, description), 
        type = COALESCE($3, type), 
        status = COALESCE($4, status), 
        updated_at = NOW()
    WHERE id = $5 
    RETURNING *
    `,
    [title, description, type, status, id],
  );

  return result;
};

const deleteIssueInDB = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id],
  );
  return result;
};

export const issuesService = {
  createIssuesInDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueInDB,
};
