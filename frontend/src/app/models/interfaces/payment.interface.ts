export interface Payment {
  id: number;
  memberId: number;
  membershipId?: number;
  amount: number;
  type: string;
  status: string;
  method?: string;
  notes?: string;
  createdAt?: string;
  memberName?: string;
}

export type PaymentCreate = Omit<Payment, 'id' | 'createdAt' | 'memberName'>;
export type PaymentUpdate = Partial<PaymentCreate>;
