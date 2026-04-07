import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

export interface FileRecord {
  id: string;
  original_name: string;
  object_key: string;
  bucket: string;
  content_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FileListResponse {
  items: FileRecord[];
  total: number;
  page: number;
  page_size: number;
}

export interface HealthResponse {
  status: string;
  minio_connected: boolean;
  db_connected: boolean;
}

export const getHealth = () => api.get<HealthResponse>("/health");

export const uploadFile = (
  file: File,
  onProgress?: (percent: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<FileRecord>("/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};

export const listFiles = (
  page = 1,
  pageSize = 20,
  search?: string
) =>
  api.get<FileListResponse>("/files", {
    params: { page, page_size: pageSize, search: search || undefined },
  });

export const getFile = (id: string) => api.get<FileRecord>(`/files/${id}`);

export const getDownloadHref = (id: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  return `${baseUrl.replace(/\/$/, "")}/files/${id}/download`;
};

export const deleteFile = (id: string) => api.delete(`/files/${id}`);

export default api;
