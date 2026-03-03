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
    const taskId = Number(process.env.DANELLA_TEST_TASK_ID ?? "6342");

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

    const deploymentResponse = await fetch(`${baseUrl}/tasks/deployment?taskId=${encodeURIComponent(String(taskId))}`, {
      headers: { "x-danella-cookie": cookieHeader },
    });
    const deploymentBody = (await deploymentResponse.json()) as JsonRecord;

    const attachmentsResponse = await fetch(`${baseUrl}/tasks/attachments?taskId=${encodeURIComponent(String(taskId))}`, {
      headers: { "x-danella-cookie": cookieHeader },
    });
    const attachmentsBody = (await attachmentsResponse.json()) as JsonRecord;

    const deleteValidationResponse = await fetch(
      `${baseUrl}/tasks/project-codes?taskId=${encodeURIComponent(String(taskId))}&taskProjectCodeId=0`,
      {
      method: "DELETE",
      headers: { "x-danella-cookie": cookieHeader },
      },
    );
    const deleteValidationBody = (await deleteValidationResponse.json()) as JsonRecord;

    const deploymentData =
      typeof deploymentBody.data === "object" && deploymentBody.data !== null
        ? (deploymentBody.data as Record<string, unknown>)
        : {};
    const portfolioList = Array.isArray(deploymentData.portfolioList) ? deploymentData.portfolioList : [];
    const assigned = Array.isArray(deploymentData.assignedProjectCodes) ? deploymentData.assignedProjectCodes : [];
    const attachments = Array.isArray(attachmentsBody.data) ? attachmentsBody.data : [];

    console.log(
      JSON.stringify(
        {
          deploymentStatus: deploymentResponse.status,
          portfolioCount: portfolioList.length,
          assignedProjectCodesCount: assigned.length,
          attachmentsStatus: attachmentsResponse.status,
          attachmentsCount: attachments.length,
          deleteValidationStatus: deleteValidationResponse.status,
          deleteValidationCode:
            typeof deleteValidationBody.error === "object" &&
            deleteValidationBody.error !== null &&
            "code" in deleteValidationBody.error
              ? (deleteValidationBody.error as { code?: string }).code
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
