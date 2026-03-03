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
