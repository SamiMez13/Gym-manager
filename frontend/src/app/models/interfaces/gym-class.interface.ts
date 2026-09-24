export interface GymClass {
  id: number;
  name: string;
  category?: string;
  description?: string;
  durationMinutes: number;
  maxCapacity: number;
  difficultyLevel?: string;
  isActive: boolean;
}

export type GymClassCreate = Omit<GymClass, 'id'>;
export type GymClassUpdate = Partial<GymClassCreate>;
