export interface ListTasksInput {
  cookieHeader: string;
  subProjectId: number;
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export interface UpstreamTask {
  taskID?: number;
  taskCode?: string;
  jobID?: string;
  subProjectID?: number;
  taskStatusName?: string;
  endCustomerName?: string;
  vendorName?: string;
  customerName?: string;
  [key: string]: unknown;
}

export interface TaskAttachment {
  attachmentID?: number;
  taskID?: number;
  fileName?: string;
  fileUrl?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  [key: string]: unknown;
}

export interface TaskPortfolioCode {
  portfolioID?: number;
  code?: string;
  description?: string;
  unit?: string;
  price?: number;
  quantity?: number;
  footage?: number;
  [key: string]: unknown;
}

export interface TaskAssignedProjectCode {
  taskProjectCodeID?: number;
  portfolioID?: number;
  code?: string;
  description?: string;
  quantity?: number;
  footage?: number;
  unit?: string;
  price?: number;
  [key: string]: unknown;
}

export interface GetTaskDeploymentInput {
  cookieHeader: string;
  taskId: number;
}

export interface GetTaskDeploymentResult {
  taskId: number;
  portfolioList: TaskPortfolioCode[];
  assignedProjectCodes: TaskAssignedProjectCode[];
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
