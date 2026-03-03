import type {
  AddCodeToTaskInput,
  AddCodeToTaskResult,
  DeleteCodeFromTaskInput,
  DeleteCodeFromTaskResult,
  GetAvailableCodesInput,
  GetAvailableCodesResult,
  GetCodeDetailInput,
  GetCodeDetailResult,
} from "./code.types";

export interface CodeRepository {
  getAvailableCodes(input: GetAvailableCodesInput): Promise<GetAvailableCodesResult>;
  getCodeDetail(input: GetCodeDetailInput): Promise<GetCodeDetailResult>;
  addCodeToTask(input: AddCodeToTaskInput): Promise<AddCodeToTaskResult>;
  deleteCodeFromTask(input: DeleteCodeFromTaskInput): Promise<DeleteCodeFromTaskResult>;
}
