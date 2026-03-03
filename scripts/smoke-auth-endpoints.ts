import dotenv from "dotenv";

import { app } from "../src/app";

dotenv.config({ path: ".env", quiet: true });

const main = async (): Promise<void> => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}/api/v1/auth`;

    const validateResponse = await fetch(`${baseUrl}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const validateBody = (await validateResponse.json()) as Record<string, unknown>;

    const logoutResponse = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const logoutBody = (await logoutResponse.json()) as Record<string, unknown>;

    console.log(
      JSON.stringify(
        {
          validate: {
            status: validateResponse.status,
            code:
              typeof validateBody.error === "object" &&
              validateBody.error !== null &&
              "code" in validateBody.error
                ? (validateBody.error as { code?: string }).code
                : null,
          },
          logout: {
            status: logoutResponse.status,
            code:
              typeof logoutBody.error === "object" &&
              logoutBody.error !== null &&
              "code" in logoutBody.error
                ? (logoutBody.error as { code?: string }).code
                : null,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exitCode = 1;
});
