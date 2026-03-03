import type {
  AddTaskProjectCodeInput,
  AddTaskProjectCodeResult,
  DeleteTaskProjectCodeInput,
  DeleteTaskProjectCodeResult,
  GetAvailableTaskProjectCodesInput,
  GetAvailableTaskProjectCodesResult,
  GetTaskAttachmentsInput,
  GetTaskAttachmentsResult,
  GetTaskDeploymentInput,
  GetTaskDeploymentResult,
  GetTaskProjectCodeDetailInput,
  GetTaskProjectCodeDetailResult,
  ListTasksInput,
  ListTasksResult,
} from "./task.types";

export interface TaskRepository {
  listBySubProject(input: ListTasksInput): Promise<ListTasksResult>;
  getDeployment(input: GetTaskDeploymentInput): Promise<GetTaskDeploymentResult>;
  getAttachments(input: GetTaskAttachmentsInput): Promise<GetTaskAttachmentsResult>;
  getAvailableTaskProjectCodes(
    input: GetAvailableTaskProjectCodesInput,
  ): Promise<GetAvailableTaskProjectCodesResult>;
  getTaskProjectCodeDetail(input: GetTaskProjectCodeDetailInput): Promise<GetTaskProjectCodeDetailResult>;
  addTaskProjectCode(input: AddTaskProjectCodeInput): Promise<AddTaskProjectCodeResult>;
  deleteTaskProjectCode(input: DeleteTaskProjectCodeInput): Promise<DeleteTaskProjectCodeResult>;
}
