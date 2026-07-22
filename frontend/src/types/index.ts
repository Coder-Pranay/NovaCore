export * from "./api";
export * from "./auth";

export type ApiError = {
  message: string;
  status?: number;
  errors?: string[];
};
