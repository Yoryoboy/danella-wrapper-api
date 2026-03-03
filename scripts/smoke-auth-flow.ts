import dotenv from "dotenv";

import { app } from "../src/app";

dotenv.config({ path: ".env", quiet: true });

type JsonRecord = Record<string, unknown>;

const main = async (): Promise<void> => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}/api/v1/auth`;

    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.DANELLA_USERNAME ?? "",
        password: process.env.DANELLA_PASSWORD ?? "",
      }),
    });

    const loginBody = (await loginResponse.json()) as JsonRecord;
    if (loginResponse.status !== 200) {
      console.log(JSON.stringify({ loginStatus: loginResponse.status, loginBody }, null, 2));
      return;
    }

    const auth = loginBody.auth as { cookieHeader?: string } | undefined;
    const cookieHeader = auth?.cookieHeader ?? "";

    const validateResponse = await fetch(`${baseUrl}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth: { cookieHeader } }),
    });
    const validateBody = (await validateResponse.json()) as JsonRecord;

    const logoutResponse = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auth: { cookieHeader } }),
    });
    const logoutBody = (await logoutResponse.json()) as JsonRecord;

    console.log(
      JSON.stringify(
        {
          loginStatus: loginResponse.status,
          validateStatus: validateResponse.status,
          validateValid: validateBody.valid ?? null,
          validateReason: validateBody.reason ?? null,
          logoutStatus: logoutResponse.status,
          logoutLoggedOut: logoutBody.loggedOut ?? null,
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
