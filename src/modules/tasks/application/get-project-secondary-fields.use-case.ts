import type {
  GetProjectSecondaryFieldsInput,
  GetProjectSecondaryFieldsResult,
  TaskRepository,
} from "../domain";

export class GetProjectSecondaryFieldsUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: GetProjectSecondaryFieldsInput): Promise<GetProjectSecondaryFieldsResult> {
    return this.taskRepository.getProjectSecondaryFields(input);
  }
}
