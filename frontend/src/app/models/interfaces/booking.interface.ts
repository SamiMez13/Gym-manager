export interface Booking {
  id: number;
  scheduleId: number;
  memberId: number;
  status: string;
  notes?: string;
  createdAt?: string;
  memberName?: string;
  className?: string;
}

export interface BookingCreate {
  scheduleId: number;
  memberId: number;
  notes?: string;
}

export type BookingUpdate = Partial<BookingCreate> & { status?: string };
