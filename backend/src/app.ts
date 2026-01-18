import express from "express";
import cors from "cors";
import routes from "./routes";
import { requestLogger } from "./middlewares/requestLogger";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";
import path from "path";

const app = express();

if (env.nodeEnv !== "production") {
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
}
app.use(express.json());
// serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(requestLogger);

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
