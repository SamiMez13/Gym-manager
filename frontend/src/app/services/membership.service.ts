import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Membership, MembershipCreate, MembershipPlan, MembershipUpdate } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MembershipService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/memberships`;
  private readonly plansUrl = `${environment.apiUrl}/membership-plans`;

  getMemberships(): Observable<Membership[]> {
    return this.http.get<Membership[]>(this.apiUrl);
  }

  getMembershipById(id: number): Observable<Membership> {
    return this.http.get<Membership>(`${this.apiUrl}/${id}`);
  }

  createMembership(data: MembershipCreate): Observable<Membership> {
    return this.http.post<Membership>(this.apiUrl, data);
  }

  updateMembership(id: number, data: MembershipUpdate): Observable<Membership> {
    return this.http.patch<Membership>(`${this.apiUrl}/${id}`, data);
  }

  deleteMembership(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPlans(): Observable<MembershipPlan[]> {
    return this.http.get<MembershipPlan[]>(this.plansUrl);
  }
}
