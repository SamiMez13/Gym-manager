import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { BookingService } from '../../services/booking.service';
import { MemberService } from '../../services/member.service';
import { ScheduleService } from '../../services/schedule.service';
import { Booking, Member, Schedule } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit {
  private readonly bookingService = inject(BookingService);
  private readonly memberService = inject(MemberService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  bookings: Booking[] = [];
  members: Member[] = [];
  schedules: Schedule[] = [];

  search = '';
  loading = true;
  modalOpen = false;
  editingBooking: Booking | null = null;
  saving = false;
  fields: FieldConfig[] = [];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.bookingService.getBookings().subscribe({
      next: (res) => {
        this.bookings = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load bookings', 'danger');
      },
    });

    this.memberService.getMembers().subscribe((m) => {
      this.members = m;
      this.buildFields();
    });

    this.scheduleService.getSchedules().subscribe((s) => {
      this.schedules = s;
      this.buildFields();
    });
  }

  buildFields(): void {
    this.fields = [
      {
        name: 'memberId',
        label: 'Member',
        type: 'select',
        options: this.members.map((m) => ({ label: `${m.firstName} ${m.lastName} (${m.email})`, value: m.id })),
        required: true,
      },
      {
        name: 'scheduleId',
        label: 'Session',
        type: 'select',
        options: this.schedules.map((s) => ({
          label: `${s.className || 'Class'} (${s.trainerName || 'Coach'} - ${s.startTime ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})`,
          value: s.id,
        })),
        required: true,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Waitlisted', value: 'waitlisted' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Attended', value: 'attended' },
        ],
      },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Special requests...', span: 2 },
    ];
  }

  get filteredBookings(): Booking[] {
    if (!this.search.trim()) return this.bookings;
    const q = this.search.toLowerCase();
    return this.bookings.filter(
      (b) =>
        (b.memberName && b.memberName.toLowerCase().includes(q)) ||
        (b.className && b.className.toLowerCase().includes(q)) ||
        b.status.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.editingBooking = null;
    this.modalOpen = true;
  }

  openEdit(booking: Booking): void {
    this.editingBooking = booking;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingBooking = null;
  }

  saveBooking(formData: Record<string, any>): void {
    this.saving = true;
    const payload = {
      ...formData,
      memberId: Number(formData['memberId']),
      scheduleId: Number(formData['scheduleId']),
    };

    if (this.editingBooking) {
      this.bookingService.updateBooking(this.editingBooking.id, payload).subscribe({
        next: (updated) => {
          this.saving = false;
          this.bookings = this.bookings.map((b) => (b.id === updated.id ? updated : b));
          this.closeModal();
          this.showToast('Booking updated', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update booking', 'danger');
        },
      });
    } else {
      this.bookingService.createBooking(payload as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.bookings.unshift(created);
          this.closeModal();
          this.showToast('Member booked for session', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to book session', 'danger');
        },
      });
    }
  }

  async confirmDelete(booking: Booking): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Cancel Booking',
      message: `Cancel booking for ${booking.memberName || 'member'}?`,
      buttons: [
        { text: 'Back', role: 'cancel' },
        {
          text: 'Cancel Booking',
          role: 'destructive',
          handler: () => {
            this.bookingService.deleteBooking(booking.id).subscribe({
              next: () => {
                this.bookings = this.bookings.filter((b) => b.id !== booking.id);
                this.showToast('Booking cancelled', 'success');
              },
              error: () => this.showToast('Could not cancel booking', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  displayDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString();
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
