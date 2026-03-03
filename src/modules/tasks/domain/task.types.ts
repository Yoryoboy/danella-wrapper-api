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
