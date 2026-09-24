import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Branch, BranchCreate, BranchUpdate } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/branches`;

  getBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(this.apiUrl);
  }

  getBranchById(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.apiUrl}/${id}`);
  }

  createBranch(data: BranchCreate): Observable<Branch> {
    return this.http.post<Branch>(this.apiUrl, data);
  }

  updateBranch(id: number, data: BranchUpdate): Observable<Branch> {
    return this.http.patch<Branch>(`${this.apiUrl}/${id}`, data);
  }

  deleteBranch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
