import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";

import { API_PREFIX, APP_NAME } from "./config/constants";
import { env } from "./config/env";
import { createApiV1Router } from "./modules";
import { errorMiddleware } from "./shared/interfaces/http/error-middleware";
import { notFoundMiddleware } from "./shared/interfaces/http/not-found-middleware";

const corsOptions: CorsOptions =
  env.allowedOrigins.length > 0
    ? {
        origin: env.allowedOrigins,
        credentials: true,
      }
    : {
        origin: true,
        credentials: true,
      };

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    service: APP_NAME,
    api: API_PREFIX,
    version: env.apiVersion,
  });
});

app.use(API_PREFIX, createApiV1Router());

app.use(notFoundMiddleware);
app.use(errorMiddleware);
