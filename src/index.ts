import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import router from "./routes/api";

async function init() {
  try {
    const app = express();
    const PORT = 3000;

    app.get("/", (req, res) => {
      res.status(200).json({
        message: "Server is running",
        data: null,
      });
    });

    app.use(cors());
    app.use(bodyParser.json());

    app.use("/api", router);

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error initializing server:", error);
  }
}

init();
