export interface ListTasksInput {
  cookieHeader: string;
  subProjectId: number;
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export interface UpstreamTask {
  [key: string]: unknown;
}

export interface TaskAttachment {
  [key: string]: unknown;
}

export interface AvailableProjectCode {
  [key: string]: unknown;
}

export interface TaskProjectCodeDetail {
  [key: string]: unknown;
}

export interface DeleteTaskProjectCodeInput {
  cookieHeader: string;
  taskProjectCodeId: number;
}

export interface DeleteTaskProjectCodeResult {
  success: boolean;
  message?: string;
  upstream: {
    status: number;
    url: string;
  };
}

export interface GetTaskDeploymentInput {
  cookieHeader: string;
  taskId: number;
}

export interface GetTaskDeploymentResult {
  taskId: number;
  portfolioList: Record<string, unknown>[];
  assignedProjectCodes: Record<string, unknown>[];
  upstream: {
    status: number;
    url: string;
  };
}

export interface GetTaskAttachmentsInput {
  cookieHeader: string;
  taskId: number;
}

export interface GetTaskAttachmentsResult {
  taskId: number;
  attachments: TaskAttachment[];
  upstream: {
    status: number;
    url: string;
  };
}

export interface GetAvailableTaskProjectCodesInput {
  cookieHeader: string;
  taskId: number;
}

export interface GetAvailableTaskProjectCodesResult {
  taskId: number;
  projectCodes: AvailableProjectCode[];
  upstream: {
    status: number;
    url: string;
  };
}

export interface GetTaskProjectCodeDetailInput {
  cookieHeader: string;
  portfolioId: number;
}

export interface GetTaskProjectCodeDetailResult {
  portfolioId: number;
  detail: TaskProjectCodeDetail;
  upstream: {
    status: number;
    url: string;
  };
}

export interface AddTaskProjectCodeInput {
  cookieHeader: string;
  taskId: number;
  portfolioId: number;
  quantity: number;
  footage: number;
}

export interface AddTaskProjectCodeResult {
  success: boolean;
  message?: string;
  upstream: {
    status: number;
    url: string;
  };
}

export interface ListTasksResult {
  items: UpstreamTask[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    subProjectId: number;
    status?: string;
    search?: string;
  };
  upstream: {
    status: number;
    url: string;
  };
}
