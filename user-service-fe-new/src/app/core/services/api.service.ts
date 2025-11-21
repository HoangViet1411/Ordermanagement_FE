import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseURL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    const url = this.baseURL + path;
    const httpParams = this.createParams(params);
    return this.http.get<T>(url, { params: httpParams });
  }

  post<T>(path: string, body: any, params?: Record<string, any>): Observable<T> {
    const url = this.baseURL + path;
    const httpParams = this.createParams(params);
    return this.http.post<T>(url, body , {params: httpParams});
  }

  put<T>(path: string, body: any, params?: Record<string,any>): Observable<T> {
    const url = this.baseURL + path;
    const httpParams = this.createParams(params);
    return this.http.put<T>(url, body, {params: httpParams});
  }

  delete<T>(path: string, params?: Record<string, any>): Observable<T> {
    const url = this.baseURL + path;
    const httpParams = this.createParams(params);
    return this.http.delete<T>(url, {params: httpParams});
  }

  private createParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }
}
