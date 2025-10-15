import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AccountInfo, TransferRequest, Txn, Page, AccountSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private http: HttpClient) {}
  me() { return this.http.get<AccountInfo>(`${environment.apiBaseUrl}/api/me/account`); }
  transfer(req: TransferRequest) { return this.http.post(`${environment.apiBaseUrl}/api/transfers`, req); }
  transactions() { return this.http.get<Txn[]>(`${environment.apiBaseUrl}/api/me/transactions`); }
  adminAccounts(page=0,size=10) {
    return this.http.get<Page<AccountSummary>>(`${environment.apiBaseUrl}/api/admin/accounts?page=${page}&size=${size}`);
  }
}
