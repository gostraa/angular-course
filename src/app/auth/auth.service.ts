import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { TokenResponse } from './auth.interface';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);
  cookieServise = inject(CookieService);
  router = inject(Router);
  baseApiUrl = 'https://icherniakov.ru/yt-course/auth/';
  token: string | null = null;
  refreshToken: string | null = null;

  get isAuth() {
    if (!this.token) {
      this.token = this.cookieServise.get('token');
      this.refreshToken = this.cookieServise.get('refreshToken');
    }
    return !!this.token;
  }

  login(payload: { username: string; password: string }) {
    const formData = new FormData();
    formData.append('username', payload.username);
    formData.append('password', payload.password);
    return this.http
      .post<TokenResponse>(`${this.baseApiUrl}token`, formData)
      .pipe(
        tap((response) => {
          this.saveTokens(response);
        })
      );
  }

  refreshAuthToken() {
    return this.http
      .post<TokenResponse>(`${this.baseApiUrl}refresh`, {
        refresh_token: this.refreshToken,
      })
      .pipe(
        tap((response) => {
          this.saveTokens(response);
        }),
        catchError((err) => {
          this.logout();
          return throwError(err);
        })
      );
  }

  logout() {
    this.cookieServise.deleteAll();
    this.token = null;
    this.refreshToken = null;
    this.router.navigate(['/login']);
  }

  saveTokens(response: TokenResponse) {
    this.token = response.access_token;
    this.refreshToken = response.refresh_token;
    this.cookieServise.set('token', this.token);
    this.cookieServise.set('refreshToken', this.refreshToken);
  }
}
