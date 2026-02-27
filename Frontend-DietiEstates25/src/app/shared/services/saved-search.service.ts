import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavedSearch, SavedSearchDTO } from '../models/SavedSearch';

@Injectable({
  providedIn: 'root'
})
export class SavedSearchService {
  private readonly API = 'http://localhost:8080/api/saved-searches';

  constructor(private http: HttpClient) {}

  getUserSavedSearches(): Observable<SavedSearch[]> {
    return this.http.get<SavedSearch[]>(this.API);
  }

  createSavedSearch(savedSearch: SavedSearchDTO): Observable<SavedSearch> {
    return this.http.post<SavedSearch>(this.API, savedSearch);
  }

  updateSavedSearch(id: number, savedSearch: SavedSearchDTO): Observable<SavedSearch> {
    return this.http.put<SavedSearch>(`${this.API}/${id}`, savedSearch);
  }

  deleteSavedSearch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
