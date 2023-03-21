import 'whatwg-fetch';

import merge from 'lodash/merge';
import { baseUrl } from '../config';

const fetchJSON = (url, options = {}, stringify) => {
  let jsonOptions = options;
  if (stringify) {
    jsonOptions = merge(
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
      options
    );
  }

  return fetch(baseUrl + url, jsonOptions)
    .then((response) => {
      return getResponseBody(response).then((body) => ({
        response,
        body,
      }));
    })
    .then(checkStatus);
};

const getResponseBody = async (response) => {
  const contentType = response.headers.get('content-type');
  const contentDisposition = response.headers.get('content-disposition');
  if (contentDisposition) {
    return response.blob();
  }

  return contentType && contentType.indexOf('json') >= 0
    ? response.clone().text().then(tryParseJSON)
    : response.clone().text();
};

const tryParseJSON = (json) => {
  if (!json) {
    return null;
  }

  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error(`Failed to parse unexpected JSON response: ${json}`);
  }
};

function ResponseError(status, response, body) {
  this.name = 'ResponseError';
  this.status = status;
  this.response = response;
  this.body = body;
}
// $FlowIssue
ResponseError.prototype = Error.prototype;

const checkStatus = ({ response, body }) => {
  if (response.ok) {
    return { response, body };
  } else {
    throw new ResponseError(response.status, response, body);
  }
};

export default fetchJSON;
