import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path : path.join(process.cwd(), ".env"),
});

export const config = {
    connectionString : process.env.CONNECTION_STRING || "",
    port : process.env.PORT || 5000,
};