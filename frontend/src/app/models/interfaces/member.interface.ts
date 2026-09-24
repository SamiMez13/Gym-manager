export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  dateOfBirth?: string;
  notes?: string;
  isActive: boolean;
  joinedAt?: string;
}

export type MemberCreate = Omit<Member, 'id' | 'joinedAt'>;
export type MemberUpdate = Partial<MemberCreate>;
