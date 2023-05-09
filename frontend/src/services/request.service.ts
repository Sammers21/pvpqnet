import 'whatwg-fetch';

import { RequestOptions, ResponseError, ParamValueType } from '../types/request';

const fetchJSON = (url: string, options: RequestOptions = {}) => {
  return fetch(url, options as RequestInit).then(checkStatus);
};

const checkStatus = (response: Response) => {
  if (response.ok) {
    return response;
  } else {
    throw new ResponseError(response.status, response);
  }
};

const convertParamArray = (key: string, paramArray: Array<ParamValueType>) => {
  let paramStr = '';
  paramArray.forEach((param) => {
    paramStr = paramStr + key + '[]=' + encodeValue(param) + '&';
  });
  return paramStr;
};

const encodeValue = (value: ParamValueType) => {
  if (typeof value === 'object') {
    return encodeURIComponent(JSON.stringify(value));
  }

  return encodeURIComponent(value);
};

const formatQueryParams = (params: Record<string, ParamValueType | ParamValueType[]>) =>
  Object.keys(params)
    .map((k) => {
      const paramValue = params[k];
      return Array.isArray(paramValue)
        ? convertParamArray(encodeURIComponent(k), paramValue)
        : `${encodeURIComponent(k)}=${encodeValue(paramValue)}`;
    })
    .join('&');

const fetchJSONWithToken = (url: string, options: RequestOptions = {}): Promise<Response> => {
  const base = options.baseUrl || '';

  const isJson = options.isJson ?? true;
  const optionsWithToken = { ...options };

  if (optionsWithToken && optionsWithToken.body && isJson) {
    optionsWithToken.body = JSON.stringify(optionsWithToken.body);
  }

  if (optionsWithToken && optionsWithToken.params) {
    const params = formatQueryParams(optionsWithToken.params);
    url = `${url}?${params}`;
  }

  return fetchJSON(base + url, optionsWithToken);
};

export default fetchJSONWithToken;
