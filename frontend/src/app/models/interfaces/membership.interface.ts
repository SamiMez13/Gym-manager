export interface MembershipPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  billingFrequency: string;
  branchAccess: string;
  isActive: boolean;
}

export interface Membership {
  id: number;
  memberId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: string;
  memberName?: string;
  planName?: string;
}

export type MembershipCreate = Omit<Membership, 'id' | 'memberName' | 'planName'>;
export type MembershipUpdate = Partial<MembershipCreate>;
