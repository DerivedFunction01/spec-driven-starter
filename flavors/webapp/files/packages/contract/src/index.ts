// The shared contract: the types both sides of the API seam
// compile against, so a shape exists exactly once (the web-stack
// standards in docs/web-stack-standards.md). The wire contract
// itself is still API.md — this package is its typed face.

export const CONTRACT_VERSION = "api/1";

export interface HealthResponse {
  status: "ok";
  contract: string;
}

// The problem-details error shape (API.md): clients switch on
// `type`; `title` is constant per type; `detail` is this
// occurrence, safe to show. Member names are the wire names —
// this interface describes the payload exactly as served.
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  correlation_id?: string;
  field_errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}
