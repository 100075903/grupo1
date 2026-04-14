import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

const STORAGE_KEY = 'compras_auth';

/**
 * Reads the JWT from localStorage and attaches it as an Authorization header.
 * Reading directly from storage (instead of injecting AuthService) avoids
 * a circular dependency: AuthInterceptor → AuthService → ApiService → HttpClient.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const token: string | null = raw ? (JSON.parse(raw) as { token?: string }).token ?? null : null;
      if (token) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }
    } catch {
      // Ignore localStorage parse errors
    }
    return next.handle(req);
  }
}
