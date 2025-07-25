import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/api";

dotenv.config();

async function init() {
  try {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get("/", (req, res) => {
      res.status(200).json({
        message: "Server is running",
        data: null,
        timestamp: new Date().toISOString(),
      });
    });

    app.use("/api", router);

    app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Error:", err);
        res.status(500).json({
          message: "Internal server error",
          error:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
    );

    app.use((req, res) => {
      res.status(404).json({
        message: "Route not found",
      });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Error initializing server:", error);
    process.exit(1);
  }
}

init();
