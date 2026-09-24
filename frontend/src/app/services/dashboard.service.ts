import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardSummary } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  getDashboardData(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.apiUrl);
  }

  seedData(force = false): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(`${environment.apiUrl}/seed`, { force });
  }

  healthCheck(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(`${environment.apiUrl}/healthz`);
  }
}
