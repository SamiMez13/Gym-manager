import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GymClass, GymClassCreate, GymClassUpdate } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GymClassService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/classes`;

  getClasses(): Observable<GymClass[]> {
    return this.http.get<GymClass[]>(this.apiUrl);
  }

  getClassById(id: number): Observable<GymClass> {
    return this.http.get<GymClass>(`${this.apiUrl}/${id}`);
  }

  createClass(data: GymClassCreate): Observable<GymClass> {
    return this.http.post<GymClass>(this.apiUrl, data);
  }

  updateClass(id: number, data: GymClassUpdate): Observable<GymClass> {
    return this.http.patch<GymClass>(`${this.apiUrl}/${id}`, data);
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
