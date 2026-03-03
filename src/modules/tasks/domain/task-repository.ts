import type { ListTasksInput, ListTasksResult } from "./task.types";

export interface TaskRepository {
  listBySubProject(input: ListTasksInput): Promise<ListTasksResult>;
}
