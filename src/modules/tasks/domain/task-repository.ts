import type {
  CreateTaskInput,
  CreateTaskResult,
  GetTaskAttachmentsInput,
  GetTaskAttachmentsResult,
  GetTaskDetailInput,
  GetTaskDetailResult,
  GetTaskFormMetadataInput,
  GetTaskFormMetadataResult,
  ListTasksInput,
  ListTasksResult,
} from "./task.types";

export interface TaskRepository {
  listBySubProject(input: ListTasksInput): Promise<ListTasksResult>;
  getTaskDetail(input: GetTaskDetailInput): Promise<GetTaskDetailResult>;
  getAttachments(input: GetTaskAttachmentsInput): Promise<GetTaskAttachmentsResult>;
  getTaskFormMetadata(input: GetTaskFormMetadataInput): Promise<GetTaskFormMetadataResult>;
  createTask(input: CreateTaskInput): Promise<CreateTaskResult>;
}
