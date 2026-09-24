import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Trainer, TrainerCreate, TrainerUpdate } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TrainerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/trainers`;

  getTrainers(): Observable<Trainer[]> {
    return this.http.get<Trainer[]>(this.apiUrl);
  }

  getTrainerById(id: number): Observable<Trainer> {
    return this.http.get<Trainer>(`${this.apiUrl}/${id}`);
  }

  createTrainer(data: TrainerCreate): Observable<Trainer> {
    return this.http.post<Trainer>(this.apiUrl, data);
  }

  updateTrainer(id: number, data: TrainerUpdate): Observable<Trainer> {
    return this.http.patch<Trainer>(`${this.apiUrl}/${id}`, data);
  }

  deleteTrainer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
