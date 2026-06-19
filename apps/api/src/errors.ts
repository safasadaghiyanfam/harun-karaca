export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function notFound(message = "Kayit bulunamadi") {
  return new AppError(404, message);
}
