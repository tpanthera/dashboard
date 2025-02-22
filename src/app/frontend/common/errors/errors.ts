// Copyright 2017 The Kubernetes Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpErrorResponse} from '@angular/common/http';
import {ErrStatus, K8sError as K8SApiError} from '@api/backendapi';
import {KdError as KdApiError} from '@api/frontendapi';

export enum ApiError {
  tokenExpired = 'MSG_TOKEN_EXPIRED_ERROR',
  encryptionKeyChanged = 'MSG_ENCRYPTION_KEY_CHANGED',
}

export enum ErrorStatus {
  unauthorized = 'Unauthorized',
  forbidden = 'Forbidden',
  internal = 'Internal error',
  unknown = 'Unknown error',
}

export enum ErrorCode {
  unauthorized = 401,
  forbidden = 403,
  internal = 500,
}

const localizedErrors: {[key: string]: string} = {
  MSG_TOKEN_EXPIRED_ERROR: 'You have been logged out because your token have expired.',
  MSG_ENCRYPTION_KEY_CHANGED: 'You have been logged out because your token is invalid.',
  MSG_ACCESS_DENIED: 'Access denied.',
  MSG_DASHBOARD_EXCLUSIVE_RESOURCE_ERROR: 'Trying to access/modify dashboard exclusive resource.',
};

/**
 * Error returned as a part of backend api calls. All server errors should be in this format.
 */
/* tslint:disable */
export class K8SError implements K8SApiError {
  ErrStatus: ErrStatus;

  toKdError(): KdError {
    return new KdError(this.ErrStatus.status, this.ErrStatus.code, this.ErrStatus.message);
  }
}
/* tslint:enable */

/**
 * Frontend specific errors or errors transformed based on server response.
 */
export class KdError implements KdApiError {
  constructor(public status: string, public code: number, public message: string) {}

  static isError(error: HttpErrorResponse, ...apiErrors: string[]): boolean {
    // API errors will set 'error' as a string.
    if (typeof error.error === 'object') {
      return false;
    }

    for (const apiErr of apiErrors) {
      if (apiErr === (error.error as string).trim()) {
        return true;
      }
    }

    return false;
  }

  localize(): KdError {
    const result = this;

    const localizedErr = localizedErrors[this.message.trim()];
    if (localizedErr) {
      this.message = localizedErr;
    }

    return result;
  }
}

export function AsKdError(error: HttpErrorResponse): KdError {
  const result = {} as KdError;
  let status: string;

  result.message = error.message;
  result.code = error.status;

  if (typeof error.error !== 'object') {
    result.message = error.error;
  }

  switch (error.status) {
    case ErrorCode.unauthorized:
      status = ErrorStatus.unauthorized;
      break;
    case ErrorCode.forbidden:
      status = ErrorStatus.forbidden;
      break;
    case ErrorCode.internal:
      status = ErrorStatus.internal;
      break;
    default:
      status = ErrorStatus.unknown;
  }

  result.status = status;
  return new KdError(result.status, result.code, result.message).localize();
}

export const ERRORS = {
  forbidden: new KdError(
    ErrorStatus.forbidden,
    ErrorCode.forbidden,
    localizedErrors.MSG_ACCESS_DENIED,
  ),
};
