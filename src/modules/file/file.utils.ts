import { TFileType } from './file.type';

export const getFileTypeFromMime = (
  mimeType: string,
  extension?: string,
): TFileType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType === 'application/msword' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.ms-word'
  ) {
    return 'doc';
  }
  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/html' ||
    mimeType === 'text/css' ||
    mimeType === 'text/javascript' ||
    mimeType.startsWith('text/')
  ) {
    return 'txt';
  }

  // Fallback to extension if MIME type is not specific
  if (extension) {
    const ext = extension.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['txt', 'text', 'md', 'html', 'css', 'js', 'json'].includes(ext))
      return 'txt';
  }

  return 'file';
};

export const getExtensionFromFilename = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot + 1).toLowerCase();
};
