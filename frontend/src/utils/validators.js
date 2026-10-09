export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

export function validatePdfFile(file, maxBytes = 10 * 1024 * 1024) {
  if (!file) {
    return { valid: false, error: 'Please select a file to upload.' };
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'Only PDF documents (.pdf) are allowed.' };
  }
  if (file.size > maxBytes) {
    return { valid: false, error: 'File size exceeds 10 MB maximum limit.' };
  }
  return { valid: true, error: null };
}
