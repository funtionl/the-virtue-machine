import express from "express";
import cors from "cors";
import routes from "./routes";
import { requestLogger } from "./middlewares/requestLogger";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(requestLogger);

app.use("/api/v1", routes);

app.use("/api/v1/users", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
