// giúp chuyển các file đặt tên có dấu hoặc cách... thành dạng chuẩn
export function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD') // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '') // xoá dấu
    .replace(/[^a-zA-Z0-9.-]/g, '-') // ký tự lạ → -
    .replace(/-+/g, '-') // gộp nhiều dấu -
    .toLowerCase();
}
