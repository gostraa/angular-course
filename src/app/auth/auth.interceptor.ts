import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenResponse } from './auth.interface';

let isRefreshing = false;

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  if (!token) return next(req);

  if (isRefreshing) {
    return refreshAndProcced(authService, req, next);
  }
  // req = req.clone({
  //   setHeaders: {
  //     Authorization: `Bearer ${token}`,
  //   },
  // });

  return next(addToken(req, token)).pipe(
    catchError((error) => {
      if (error.status === 403) {
        return refreshAndProcced(authService, req, next);
      }
      return throwError(error);
    })
  );
};

const refreshAndProcced = (
  authService: AuthService,
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  if (!isRefreshing) {
    isRefreshing = true;
    return authService.refreshAuthToken().pipe(
      switchMap((response: TokenResponse) => {
        isRefreshing = false;
        return next(addToken(req, response.access_token));
      })
    );
  }
  return next(addToken(req, authService.token!));
};

const addToken = (req: HttpRequest<any>, token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};
