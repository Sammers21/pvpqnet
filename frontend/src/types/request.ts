export type ParamValueType = object | string | number;
export type RequestBodyType = object | string | null;

export type ResponseType = { response: Response; body: any };

export interface ILoginFunctionProps {
  username?: string | null;
  password?: string | null;
}

export interface IRegisterFunctionProps extends ILoginFunctionProps {}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  isJson?: boolean;
  baseUrl?: string;
  params?: Record<string, ParamValueType>;
  body?: RequestBodyType;
}

export class ResponseError extends Error {
  status: number;
  response: Response;
  body: unknown;

  constructor(status: number, response: Response) {
    super();
    this.name = 'ResponseError';
    this.status = status;
    this.response = response;
    Object.setPrototypeOf(this, ResponseError.prototype);
  }
}

export type FetchConfiguration = {
  refreshToken: () => Promise<void>;
  shouldRefreshToken: (error: ResponseError) => boolean;
  fetch: (url: string, options: RequestOptions) => Promise<Response>;
};
