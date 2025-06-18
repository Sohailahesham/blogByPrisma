
class AppError extends Error {
  statusCode: number;
  status: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

      this.name = this.constructor.name;

      Error.captureStackTrace(this, this.constructor);
    // Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;