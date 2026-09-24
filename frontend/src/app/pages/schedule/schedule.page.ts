import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { ScheduleService } from '../../services/schedule.service';
import { GymClassService } from '../../services/gym-class.service';
import { TrainerService } from '../../services/trainer.service';
import { BranchService } from '../../services/branch.service';
import { Branch, GymClass, Schedule, Trainer } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
})
export class SchedulePage implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  private readonly classService = inject(GymClassService);
  private readonly trainerService = inject(TrainerService);
  private readonly branchService = inject(BranchService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  schedules: Schedule[] = [];
  classes: GymClass[] = [];
  trainers: Trainer[] = [];
  branches: Branch[] = [];

  search = '';
  loading = true;
  modalOpen = false;
  editingSchedule: Schedule | null = null;
  saving = false;
  fields: FieldConfig[] = [];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.scheduleService.getSchedules().subscribe({
      next: (res) => {
        this.schedules = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load schedules', 'danger');
      },
    });

    this.classService.getClasses().subscribe((c) => {
      this.classes = c;
      this.buildFields();
    });
    this.trainerService.getTrainers().subscribe((t) => {
      this.trainers = t;
      this.buildFields();
    });
    this.branchService.getBranches().subscribe((b) => {
      this.branches = b;
      this.buildFields();
    });
  }

  buildFields(): void {
    this.fields = [
      {
        name: 'classId',
        label: 'Gym Class',
        type: 'select',
        options: this.classes.map((c) => ({ label: c.name, value: c.id })),
        required: true,
      },
      {
        name: 'trainerId',
        label: 'Trainer',
        type: 'select',
        options: this.trainers.map((t) => ({ label: `${t.firstName} ${t.lastName}`, value: t.id })),
        required: true,
      },
      {
        name: 'branchId',
        label: 'Branch Location',
        type: 'select',
        options: this.branches.map((b) => ({ label: b.name, value: b.id })),
        required: true,
      },
      { name: 'maxCapacity', label: 'Max Capacity', type: 'number', placeholder: '20', required: true },
      { name: 'startTime', label: 'Start Time', type: 'datetime-local', required: true },
      { name: 'endTime', label: 'End Time', type: 'datetime-local', required: true },
    ];
  }

  get filteredSchedules(): Schedule[] {
    if (!this.search.trim()) return this.schedules;
    const q = this.search.toLowerCase();
    return this.schedules.filter(
      (s) =>
        (s.className && s.className.toLowerCase().includes(q)) ||
        (s.trainerName && s.trainerName.toLowerCase().includes(q)) ||
        (s.branchName && s.branchName.toLowerCase().includes(q))
    );
  }

  openCreate(): void {
    this.editingSchedule = null;
    this.modalOpen = true;
  }

  openEdit(schedule: Schedule): void {
    this.editingSchedule = schedule;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingSchedule = null;
  }

  saveSchedule(formData: Record<string, any>): void {
    this.saving = true;
    const payload = {
      ...formData,
      classId: Number(formData['classId']),
      trainerId: Number(formData['trainerId']),
      branchId: Number(formData['branchId']),
      maxCapacity: Number(formData['maxCapacity']),
    };

    if (this.editingSchedule) {
      this.scheduleService.updateSchedule(this.editingSchedule.id, payload).subscribe({
        next: (updated) => {
          this.saving = false;
          this.schedules = this.schedules.map((s) => (s.id === updated.id ? updated : s));
          this.closeModal();
          this.showToast('Schedule updated', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update schedule', 'danger');
        },
      });
    } else {
      this.scheduleService.createSchedule(payload as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.schedules.unshift(created);
          this.closeModal();
          this.showToast('Class session scheduled', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to schedule class', 'danger');
        },
      });
    }
  }

  async confirmDelete(schedule: Schedule): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Schedule',
      message: `Are you sure you want to cancel and remove this session?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.scheduleService.deleteSchedule(schedule.id).subscribe({
              next: () => {
                this.schedules = this.schedules.filter((s) => s.id !== schedule.id);
                this.showToast('Schedule removed', 'success');
              },
              error: () => this.showToast('Could not delete schedule', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  displayTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  displayDate(iso?: string): string {
    if (!iso) return '';
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
