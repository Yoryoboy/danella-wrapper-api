export interface ListTasksInput {
  cookieHeader: string;
  subProjectId: number;
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export interface GetTaskFormMetadataInput {
  cookieHeader: string;
  subProjectId: number;
}

export interface GetProjectSecondaryFieldsInput {
  cookieHeader: string;
  projectId: number;
}

export interface CreateTaskInput {
  cookieHeader: string;
  subProjectId: number;
  jobId: string;
  verifierKeyId: string;
  endCustomerId: number;
  managerAreaId: number;
}

export interface UpdateTaskSecondaryFieldsInput {
  cookieHeader: string;
  taskId: number;
  fields: Array<{
    label: string;
    value: string;
  }>;
}

export interface ResolvedTaskSecondaryFieldUpdate {
  taskSecondaryFieldId: number;
  label: string;
  value: string;
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
  description?: string;
  userName?: string;
  createDate?: string;
  taskAttachmentsID?: number;
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

export interface TaskMessage {
  [key: string]: unknown;
}

export interface TaskPrimaryJobLink {
  label: string;
  taskId: number | null;
  href: string | null;
}

export interface TaskPrimaryDetails {
  taskCode: string | null;
  creationDate: string | null;
  jobId: string | null;
  jobLinks: TaskPrimaryJobLink[];
  startDate: string | null;
  customerBu: string | null;
  estimatedClosingDate: string | null;
  endCustomer: string | null;
  endDate: string | null;
  legalEntity: string | null;
  managerArea: string | null;
  forecastRevenueAmount: string | null;
  forecastCostAmount: string | null;
  projectType: string | null;
  jobType: string | null;
  extra: Record<string, string | null>;
}

export interface TaskSecondaryField {
  taskSecondaryFieldId: number | null;
  label: string;
  value: string | null;
}

export interface ProjectSecondaryField {
  projectSecondaryFieldId: number | null;
  label: string;
}

export interface TaskAssignmentRow {
  resource: string | null;
  positionTitle: string | null;
  dayValues: Record<string, string | null>;
}

export interface TaskVendorAssignment {
  title: string | null;
  resourceName: string | null;
  role: string | null;
  totalHours: string | null;
  startDate: string | null;
  endDate: string | null;
  extra: Record<string, string | null>;
}

export interface TaskAssignmentControl {
  headers: string[];
  inHouseRows: TaskAssignmentRow[];
  vendorSummary: string | null;
  vendorAssignments: TaskVendorAssignment[];
}

export interface GetTaskDetailInput {
  cookieHeader: string;
  taskId: number;
}

export interface GetTaskDetailResult {
  taskId: number;
  primaryDetails: TaskPrimaryDetails;
  secondaryFields: TaskSecondaryField[];
  assignmentControl: TaskAssignmentControl;
  projectCodes: {
    available: TaskPortfolioCode[];
    assigned: TaskAssignedProjectCode[];
  };
  attachments: TaskAttachment[];
  messages: TaskMessage[];
  upstream: {
    deployment: {
      status: number;
      url: string;
    };
    attachments: {
      status: number;
      url: string;
    };
    messages: {
      status: number;
      url: string;
    };
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

export interface TaskMetadataDictionaryItem {
  id: number;
  name: string;
  code: string | null;
}

export interface TaskMetadataJobTypeDictionaryItem extends TaskMetadataDictionaryItem {
  projectTypeId: number;
}

export interface GetTaskFormMetadataResult {
  subProject: TaskMetadataDictionaryItem;
  project: TaskMetadataDictionaryItem;
  customer: TaskMetadataDictionaryItem;
  projectType: TaskMetadataDictionaryItem;
  jobTypeDefault: TaskMetadataDictionaryItem;
  endCustomers: TaskMetadataDictionaryItem[];
  managerAreas: TaskMetadataDictionaryItem[];
  jobTypesByProjectType: TaskMetadataJobTypeDictionaryItem[];
  upstream: {
    status: number;
    url: string;
    jobTypesStatus: number;
    jobTypesUrl: string;
  };
}

export interface GetProjectSecondaryFieldsResult {
  projectId: number;
  projectName: string | null;
  items: ProjectSecondaryField[];
  upstream: {
    status: number;
    url: string;
  };
}

export interface CreateTaskResult {
  success: boolean;
  message?: string;
  data: {
    subProjectId: number;
    jobId: string;
    verifierKeyId: string;
    endCustomerId: number;
    managerAreaId: number;
  };
  upstream: {
    status: number;
    url: string;
  };
}

export interface UpdateTaskSecondaryFieldsResult {
  success: boolean;
  message: string;
  data: {
    taskId: number;
    updatedFields: ResolvedTaskSecondaryFieldUpdate[];
    secondaryFields: TaskSecondaryField[];
  };
  upstream: {
    update: {
      status: number;
      url: string;
    };
    verification: {
      deployment: {
        status: number;
        url: string;
      };
      attachments: {
        status: number;
        url: string;
      };
      messages: {
        status: number;
        url: string;
      };
    };
  };
}

export interface UpdateTaskSecondaryFieldsUpstreamInput {
  cookieHeader: string;
  taskId: number;
  fields: ResolvedTaskSecondaryFieldUpdate[];
}

export interface UpdateTaskSecondaryFieldsUpstreamResult {
  success: boolean;
  message: string;
  upstream: {
    status: number;
    url: string;
  };
}
