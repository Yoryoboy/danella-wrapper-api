import { app } from "./app";
import { API_PREFIX } from "./config/constants";
import { env } from "./config/env";
import { logger } from "./shared/infrastructure/logger";

app.listen(env.port, () => {
  logger.info("Server started", {
    nodeEnv: env.nodeEnv,
    port: env.port,
    apiPrefix: API_PREFIX,
  });
});
