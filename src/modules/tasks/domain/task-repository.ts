import type {
  CreateTaskInput,
  CreateTaskResult,
  GetTaskAttachmentsInput,
  GetTaskAttachmentsResult,
  GetTaskDetailInput,
  GetTaskDetailResult,
  GetProjectSecondaryFieldsInput,
  GetProjectSecondaryFieldsResult,
  GetTaskFormMetadataInput,
  GetTaskFormMetadataResult,
  ListTasksInput,
  ListTasksResult,
  UpdateTaskSecondaryFieldsUpstreamInput,
  UpdateTaskSecondaryFieldsUpstreamResult,
} from "./task.types";

export interface TaskRepository {
  listBySubProject(input: ListTasksInput): Promise<ListTasksResult>;
  getTaskDetail(input: GetTaskDetailInput): Promise<GetTaskDetailResult>;
  getAttachments(input: GetTaskAttachmentsInput): Promise<GetTaskAttachmentsResult>;
  getTaskFormMetadata(input: GetTaskFormMetadataInput): Promise<GetTaskFormMetadataResult>;
  getProjectSecondaryFields(input: GetProjectSecondaryFieldsInput): Promise<GetProjectSecondaryFieldsResult>;
  createTask(input: CreateTaskInput): Promise<CreateTaskResult>;
  updateTaskSecondaryFields(
    input: UpdateTaskSecondaryFieldsUpstreamInput,
  ): Promise<UpdateTaskSecondaryFieldsUpstreamResult>;
}
