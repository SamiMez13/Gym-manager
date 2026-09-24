import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Schedule, ScheduleCreate, ScheduleUpdate } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/schedules`;

  getSchedules(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(this.apiUrl);
  }

  getScheduleById(id: number): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.apiUrl}/${id}`);
  }

  createSchedule(data: ScheduleCreate): Observable<Schedule> {
    return this.http.post<Schedule>(this.apiUrl, data);
  }

  updateSchedule(id: number, data: ScheduleUpdate): Observable<Schedule> {
    return this.http.patch<Schedule>(`${this.apiUrl}/${id}`, data);
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
