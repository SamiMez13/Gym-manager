import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  get<T>(resource: string): Observable<T> {
    return this.http.get<T>(`${this.base}/${resource}`);
  }

  post<T>(resource: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${resource}`, body);
  }

  patch<T>(resource: string, id: number, body: unknown): Observable<T> {
    return this.http.patch<T>(`${this.base}/${resource}/${id}`, body);
  }

  delete(resource: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${resource}/${id}`);
  }
}