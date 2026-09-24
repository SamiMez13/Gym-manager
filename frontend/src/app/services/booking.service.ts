import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Booking, BookingCreate, BookingUpdate } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/bookings`;

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.apiUrl);
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  createBooking(data: BookingCreate): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, data);
  }

  updateBooking(id: number, data: BookingUpdate): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, data);
  }

  deleteBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
