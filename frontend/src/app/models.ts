export interface LoginResponse { token: string; }
export interface AccountInfo { username: string; accountNumber: string; balance: number; }
export interface TransferRequest { recipientAccountNumber: string; amount: number; }
export interface Txn { id: number; senderAccount: string; recipientAccount: string; amount: number; createdAt: string; }
export interface Page<T> { content: T[]; totalElements: number; number: number; size: number; }
export interface AccountSummary { userId: number; username: string; accountNumber: string; balance: string; }
