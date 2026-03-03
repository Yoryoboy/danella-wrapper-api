import dotenv from "dotenv";

import { app } from "../src/app";

dotenv.config({ path: ".env", quiet: true });

const main = async (): Promise<void> => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.DANELLA_USERNAME ?? "",
        password: process.env.DANELLA_PASSWORD ?? "",
      }),
    });

    const body = (await response.json()) as Record<string, unknown>;

    if (response.status !== 200) {
      console.log(
        JSON.stringify(
          {
            status: response.status,
            success: body.success,
            errorCode:
              typeof body.error === "object" &&
              body.error !== null &&
              "code" in body.error
                ? (body.error as { code?: string }).code
                : null,
          },
          null,
          2,
        ),
      );
      return;
    }

    const auth = body.auth as { type?: string; cookieHeader?: string } | undefined;
    console.log(
      JSON.stringify(
        {
          status: response.status,
          success: body.success,
          authType: auth?.type ?? null,
          hasCookieHeader: Boolean(auth?.cookieHeader),
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
