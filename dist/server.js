

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/app.ts
var import_express3 = __toESM(require("express"));

// src/db/index.ts
var import_pg = require("pg");

// src/config/index.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
import_dotenv.default.config({
  path: import_path.default.join(process.cwd(), ".env")
});
var config = {
  connectionString: process.env.CONNECTION_STRING || "",
  port: process.env.PORT || 5e3,
  secret: process.env.SECRET,
  refreshSecret: process.env.REFRESH_SECRET
};

// src/db/index.ts
var pool = new import_pg.Pool({
  connectionString: config.connectionString
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20),
        status VARCHAR(20) DEFAULT 'open',
        reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        `);
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// src/modules/auth/auth.route.ts
var import_express = require("express");

// src/modules/auth/auth.service.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var signUpUserInDB = async (payload) => {
  const { name, email, password, role } = payload;
  const user = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email]
  );
  if (user.rows.length > 0) {
    throw new Error("User Already Exists");
  }
  const hashPassword = await import_bcryptjs.default.hash(password, 10);
  const result = await pool.query(
    `
        INSERT INTO users (name,email,password,role) VALUES ($1, $2, $3, COALESCE($4,'contributor')) RETURNING *
        `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserInDB = async (payload) => {
  const { email, password } = payload;
  const user = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email]
  );
  if (user.rows.length === 0) {
    throw new Error("User not found");
  }
  const isValidPassword = await import_bcryptjs.default.compare(password, user.rows[0].password);
  if (!isValidPassword) {
    throw new Error("Invalid password");
  }
  const jwtPayload = {
    id: user.rows[0].id,
    name: user.rows[0].name,
    email: user.rows[0].email,
    role: user.rows[0].role,
    created_at: user.rows[0].created_at,
    updated_at: user.rows[0].updated_at
  };
  const token = import_jsonwebtoken.default.sign(jwtPayload, config.secret, {
    expiresIn: "1d"
  });
  return { token, user: jwtPayload };
};
var authService = {
  signUpUserInDB,
  loginUserInDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signUpUser = async (req, res) => {
  try {
    const result = await authService.signUpUserInDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User Signed Up successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Error inserting data",
      error: error.message
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserInDB(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "User Logged In successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Error logging in",
      error: error.message
    });
  }
};
var authController = {
  signUpUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = (0, import_express.Router)();
router.post("/signup", authController.signUpUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
var import_express2 = require("express");

// src/modules/issues/issues.service.ts
var createIssuesInDB = async (payload) => {
  const { title, description, type, status, user_id } = payload;
  const allowedTypes = ["bug", "feature_request"];
  if (!allowedTypes.includes(type)) {
    throw new Error("Invalid type input.");
  }
  const allowedStatus = ["in_progress", "open", "resolved"];
  if (status && !allowedStatus.includes(status)) {
    throw new Error("Invalid status input.");
  }
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, status, reporter_id) 
    VALUES ($1, $2, $3, COALESCE($4, 'open'), $5) 
    RETURNING *`,
    [title, description, type, status, user_id]
  );
  return result;
};
var getAllIssuesFromDB = async () => {
  const result = await pool.query(`SELECT * FROM issues`);
  if (result.rows.length === 0) {
    throw new Error("No issues found");
  }
  const issues = result.rows;
  const reporterIds = issues.map((issue) => issue.reporter_id);
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const reporterMap = reporterResult.rows.reduce(
    (acc, reporter) => {
      acc[reporter.id] = reporter;
      return acc;
    },
    {}
  );
  return issues.map((issue) => ({
    ...issue,
    reporter: reporterMap[issue.reporter_id] ?? null
  }));
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id
  ]);
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0] ?? null;
  return { ...issue, reporter };
};
var updateIssueInDB = async (payload, id, user) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can only update your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("You can only update issues that are open");
    }
  }
  const { title, description, type, status } = payload;
  const allowedTypes = ["bug", "feature_request"];
  if (type && !allowedTypes.includes(type)) {
    throw new Error("Invalid type input.");
  }
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
    [title, description, type, status, id]
  );
  return result;
};
var deleteIssueInDB = async (id) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  return result;
};
var issuesService = {
  createIssuesInDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueInDB
};

// src/modules/issues/issues.controller.ts
var createIssues = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      user_id: req.user.id
    };
    const result = await issuesService.createIssuesInDB(payload);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue Created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Error inserting data",
      error: error.message
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issuesService.getAllIssuesFromDB();
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue Retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Error Retrieving issues",
      error: error.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.getSingleIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Error Retrieving issues",
      error: error.message
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.updateIssueInDB(
      req.body,
      id,
      req.user
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Error updating issue",
      error: error.message
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.deleteIssueInDB(id);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Error deleting issue",
      error: error.message
    });
  }
};
var issuesController = {
  createIssues,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      const decoded = import_jsonwebtoken2.default.verify(
        token,
        config.secret
      );
      const userData = await pool.query("SELECT * FROM users WHERE email=$1", [
        decoded.email
      ]);
      const user = userData.rows[0];
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden, Role not allowed" });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  };
};
var auth_default = auth;

// src/modules/issues/issues.route.ts
var router2 = (0, import_express2.Router)();
router2.post("/", auth_default(), issuesController.createIssues);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.put("/:id", auth_default("maintainer", "contributor"), issuesController.updateIssue);
router2.delete("/:id", auth_default("maintainer"), issuesController.deleteIssue);
var issuesRoute = router2;

// src/app.ts
var app = (0, import_express3.default)();
app.use(import_express3.default.json());
app.use(import_express3.default.text());
app.use(import_express3.default.urlencoded({ extended: true }));
initDB();
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevPulse Server",
    author: "Tawsif Hossain"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
var app_default = app;

// src/server.ts
var main = async () => {
  try {
    await initDB();
    app_default.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start the application:", error);
  }
};
main();
//# sourceMappingURL=server.js.map