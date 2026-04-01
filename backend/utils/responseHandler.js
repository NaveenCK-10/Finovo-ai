// Standardized JSON response format
export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data: data,
    error: null
  });
};

export const errorResponse = (res, errorMessage, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: errorMessage
  });
};

export const badRequest = (res, message = 'Bad Request') => {
  return errorResponse(res, message, 400);
};

export const notFound = (res, message = 'Not Found') => {
  return errorResponse(res, message, 404);
};
