import app from "./app.js";
import { config } from "./config";
import { initDB } from "./db";

const main = async () => {
  try {
    await initDB();
    
    app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start the application:", error);
  }
};

main();