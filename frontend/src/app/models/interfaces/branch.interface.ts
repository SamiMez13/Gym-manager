export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  capacity?: number;
  isActive: boolean;
}

export type BranchCreate = Omit<Branch, 'id'>;
export type BranchUpdate = Partial<BranchCreate>;
