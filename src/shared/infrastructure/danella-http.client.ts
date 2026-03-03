import axios, { type AxiosInstance } from "axios";

import { env } from "../../config/env";

export const createDanellaHttpClient = (): AxiosInstance => {
  return axios.create({
    baseURL: env.danella.baseUrl,
    timeout: env.danella.timeoutMs,
  });
};
