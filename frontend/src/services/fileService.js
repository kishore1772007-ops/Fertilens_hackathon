import { apiClient } from './apiClient';

export const fileService = {
  /**
   * Fetches an authorized document blob and opens it in a browser tab
   */
  async viewFile(documentId, filename = 'document.pdf') {
    const response = await apiClient.get(`/documents/${documentId}/file`, {
      responseType: 'blob',
    });

    const fileBlob = new Blob([response.data], { type: 'application/pdf' });
    const fileUrl = URL.createObjectURL(fileBlob);

    // Open in a new tab
    const newWindow = window.open(fileUrl, '_blank');
    if (!newWindow) {
      // Fallback if popup blocked: trigger direct download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Revoke object URL after delay
    setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 60000);
  },

  /**
   * Downloads an authorized file directly to the client
   */
  async downloadFile(documentId, filename = 'document.pdf') {
    const response = await apiClient.get(`/documents/${documentId}/file`, {
      responseType: 'blob',
    });

    const fileBlob = new Blob([response.data], { type: 'application/pdf' });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 10000);
  },
};
