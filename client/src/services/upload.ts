import { apiRequest } from "@/lib/queryClient";
import type { UploadFile } from "@/types/upload";

export const uploadFile = async (file: File): Promise<UploadFile> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/uploads', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  return await res.json();
};

export const getUploads = async (): Promise<UploadFile[]> => {
  const res = await apiRequest('GET', '/api/uploads');
  return await res.json();
};

export const getUploadById = async (id: number): Promise<UploadFile> => {
  const res = await apiRequest('GET', `/api/uploads/${id}`);
  return await res.json();
};

export const reanalyzeUpload = async (id: number): Promise<UploadFile> => {
  const res = await apiRequest('POST', `/api/uploads/${id}/reanalyze`);
  return await res.json();
};

export const deleteUpload = async (id: number): Promise<void> => {
  await apiRequest('DELETE', `/api/uploads/${id}`);
};
