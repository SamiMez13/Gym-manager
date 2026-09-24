import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Member, MemberCreate, MemberUpdate } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/members`;

  getMembers(): Observable<Member[]> {
    return this.http.get<Member[]>(this.apiUrl);
  }

  getMemberById(id: number): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${id}`);
  }

  createMember(data: MemberCreate): Observable<Member> {
    return this.http.post<Member>(this.apiUrl, data);
  }

  updateMember(id: number, data: MemberUpdate): Observable<Member> {
    return this.http.patch<Member>(`${this.apiUrl}/${id}`, data);
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
