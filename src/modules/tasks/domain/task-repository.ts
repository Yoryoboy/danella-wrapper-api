import type {
  GetTaskAttachmentsInput,
  GetTaskAttachmentsResult,
  GetTaskDeploymentInput,
  GetTaskDeploymentResult,
  ListTasksInput,
  ListTasksResult,
} from "./task.types";

export interface TaskRepository {
  listBySubProject(input: ListTasksInput): Promise<ListTasksResult>;
  getDeployment(input: GetTaskDeploymentInput): Promise<GetTaskDeploymentResult>;
  getAttachments(input: GetTaskAttachmentsInput): Promise<GetTaskAttachmentsResult>;
}
