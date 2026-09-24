export interface Trainer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  isActive: boolean;
}

export type TrainerCreate = Omit<Trainer, 'id'>;
export type TrainerUpdate = Partial<TrainerCreate>;
