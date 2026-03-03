import { Router } from "express";

import {
  AddCodeToTaskUseCase,
  DeleteCodeFromTaskUseCase,
  GetAvailableCodesUseCase,
  GetCodeDetailUseCase,
} from "../application";
import { DanellaCodeClient } from "../infrastructure";
import { CodesController } from "./codes.controller";

export const createCodesRouter = (): Router => {
  const codeRepository = new DanellaCodeClient();
  const getAvailableCodesUseCase = new GetAvailableCodesUseCase(codeRepository);
  const getCodeDetailUseCase = new GetCodeDetailUseCase(codeRepository);
  const addCodeToTaskUseCase = new AddCodeToTaskUseCase(codeRepository);
  const deleteCodeFromTaskUseCase = new DeleteCodeFromTaskUseCase(codeRepository);
  const codesController = new CodesController(
    getAvailableCodesUseCase,
    getCodeDetailUseCase,
    addCodeToTaskUseCase,
    deleteCodeFromTaskUseCase,
  );

  const router = Router();

  router.get("/available", codesController.available);
  router.get("/detail", codesController.detail);
  router.post("/", codesController.add);
  router.delete("/", codesController.delete);

  return router;
};
