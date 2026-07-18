import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const body: ApiErrorBody = {
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export function unauthorized(message = "Authentication required") {
  return apiError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden") {
  return apiError(403, "FORBIDDEN", message);
}

export function notFound(message = "Not found") {
  return apiError(404, "NOT_FOUND", message);
}

export function badRequest(message: string, details?: unknown) {
  return apiError(400, "BAD_REQUEST", message, details);
}

export function conflict(message: string, details?: unknown) {
  return apiError(409, "CONFLICT", message, details);
}

export function unprocessable(message: string, details?: unknown) {
  return apiError(422, "UNPROCESSABLE", message, details);
}

export function upstreamError(message: string, details?: unknown) {
  return apiError(502, "UPSTREAM_ERROR", message, details);
}
