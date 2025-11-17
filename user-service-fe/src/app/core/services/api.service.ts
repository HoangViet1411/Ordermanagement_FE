import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api'; 

  constructor(private http: HttpClient) {}

  post<T>(endpoint: string, data: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, options);
  }

  get<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, options);
  }

  put<T>(endpoint: string, data: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, options);
  }

  delete<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, options);
  }
}