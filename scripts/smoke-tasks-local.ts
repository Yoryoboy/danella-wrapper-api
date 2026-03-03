import dotenv from "dotenv";

import { app } from "../src/app";

dotenv.config({ path: ".env", quiet: true });

type JsonRecord = Record<string, unknown>;

const main = async (): Promise<void> => {
  const server = app.listen(0);

  try {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}/api/v1`;
    const subProjectId = Number(process.env.DANELLA_TEST_SUBPROJECT_ID ?? "45");

    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
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

    const tasksResponse = await fetch(
      `${baseUrl}/tasks?subProjectId=${encodeURIComponent(String(subProjectId))}&page=1&limit=50`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-danella-cookie": cookieHeader,
        },
      },
    );

    const tasksBody = (await tasksResponse.json()) as JsonRecord;
    const data = Array.isArray(tasksBody.data) ? tasksBody.data : [];

    console.log(
      JSON.stringify(
        {
          status: tasksResponse.status,
          success: tasksBody.success ?? null,
          count: data.length,
          firstTaskCode:
            data.length > 0 && typeof data[0] === "object" && data[0] !== null && "taskCode" in data[0]
              ? (data[0] as { taskCode?: string }).taskCode
              : null,
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
