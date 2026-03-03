export interface AvailableCode {
  portfolioID?: number;
  code?: string;
  description?: string;
  unit?: string;
  price?: number;
  quantity?: number;
  footage?: number;
  [key: string]: unknown;
}

export interface CodeDetail {
  portfolioID?: number;
  code?: string;
  description?: string;
  unit?: string;
  price?: number;
  quantity?: number;
  footage?: number;
  [key: string]: unknown;
}

export interface GetAvailableCodesInput {
  cookieHeader: string;
  taskId: number;
}

export interface GetAvailableCodesResult {
  taskId: number;
  codes: AvailableCode[];
  upstream: {
    status: number;
    url: string;
  };
}

export interface GetCodeDetailInput {
  cookieHeader: string;
  portfolioId: number;
}

export interface GetCodeDetailResult {
  portfolioId: number;
  detail: CodeDetail;
  upstream: {
    status: number;
    url: string;
  };
}

export interface AddCodeToTaskInput {
  cookieHeader: string;
  taskId: number;
  portfolioId: number;
  quantity: number;
  footage: number;
}

export interface AddCodeToTaskResult {
  success: boolean;
  message?: string;
  upstream: {
    status: number;
    url: string;
  };
}

export interface DeleteCodeFromTaskInput {
  cookieHeader: string;
  taskProjectCodeId: number;
}

export interface DeleteCodeFromTaskResult {
  success: boolean;
  message?: string;
  upstream: {
    status: number;
    url: string;
  };
}
