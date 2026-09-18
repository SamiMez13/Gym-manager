import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from './api.service';

type Section = 'dashboard' | 'members' | 'memberships' | 'trainers' | 'classes' | 'schedule' | 'bookings' | 'payments' | 'branches';
type FieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'toggle';

interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  required?: boolean;
  span?: 1 | 2;
}

interface NavItem { id: Section; label: string; icon: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  readonly navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { id: 'members', label: 'Members', icon: 'people-outline' },
    { id: 'memberships', label: 'Memberships', icon: 'ribbon-outline' },
    { id: 'trainers', label: 'Trainers', icon: 'barbell-outline' },
    { id: 'classes', label: 'Classes', icon: 'fitness-outline' },
    { id: 'schedule', label: 'Schedule', icon: 'calendar-outline' },
    { id: 'bookings', label: 'Bookings', icon: 'clipboard-outline' },
    { id: 'payments', label: 'Payments', icon: 'card-outline' },
    { id: 'branches', label: 'Branches', icon: 'business-outline' },
  ];

  activeSection: Section = 'dashboard';
  readonly today = new Date();
  search = '';
  loading = true;
  saving = false;
  modalOpen = false;
  editingId: number | null = null;
  form: FormGroup = this.fb.group({});
  fields: FieldConfig[] = [];

  stats: Record<string, number> = {};
  data: Record<string, any[]> = {
    members: [], memberships: [], trainers: [], classes: [], schedules: [],
    bookings: [], payments: [], branches: [], 'membership-plans': [],
  };

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAll();
  }

  get currentRows(): any[] {
    const resource = this.resourceFor(this.activeSection);
    const rows = this.data[resource] ?? [];
    if (!this.search.trim()) return rows;
    const needle = this.search.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }

  get currentTitle(): string {
    return this.navItems.find((item) => item.id === this.activeSection)?.label ?? 'Dashboard';
  }

  selectSection(section: Section): void {
    this.activeSection = section;
    this.search = '';
    if (section !== 'dashboard' && !this.data[this.resourceFor(section)]?.length) this.loadResource(this.resourceFor(section));
  }

  resourceFor(section: Section): string {
    return section === 'classes' ? 'classes' : section === 'memberships' ? 'memberships' : section === 'schedule' ? 'schedules' : section;
  }

  loadAll(): void {
    const resources = ['members', 'membership-plans', 'memberships', 'trainers', 'classes', 'schedules', 'bookings', 'payments', 'branches'];
    resources.forEach((resource) => this.loadResource(resource));
    this.loading = false;
  }

  loadResource(resource: string): void {
    this.api.get<any[]>(resource).subscribe({
      next: (rows) => this.data[resource] = rows,
      error: () => this.presentToast(`Could not load ${resource}`, 'danger'),
    });
  }

  loadDashboard(): void {
    this.api.get<Record<string, number>>('dashboard/stats').subscribe({
      next: (stats) => this.stats = stats,
      error: () => this.presentToast('Dashboard stats are unavailable', 'warning'),
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.fields = this.buildFields(this.activeSection);
    this.form = this.buildForm(this.fields);
    this.modalOpen = true;
  }

  openEdit(row: any): void {
    this.editingId = row.id;
    this.fields = this.buildFields(this.activeSection);
    this.form = this.buildForm(this.fields, row);
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingId = null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const wasEditing = this.editingId !== null;
    const resource = this.resourceFor(this.activeSection);
    const body = this.normalizePayload(this.form.getRawValue());
    const request = this.editingId
      ? this.api.patch(resource, this.editingId, body)
      : this.api.post(resource, body);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadResource(resource);
        if (resource === 'memberships' || resource === 'payments') this.loadDashboard();
        this.presentToast(wasEditing ? 'Changes saved' : `${this.currentTitle} created`, 'success');
      },
      error: (error) => {
        this.saving = false;
        this.presentToast(error?.error?.detail ?? 'Could not save changes', 'danger');
      },
    });
  }

  async remove(row: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete record?',
      message: 'This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            const resource = this.resourceFor(this.activeSection);
            this.api.delete(resource, row.id).subscribe({
              next: () => { this.loadResource(resource); this.presentToast('Record deleted', 'success'); },
              error: () => this.presentToast('Could not delete record', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async updateBooking(row: any, status: string): Promise<void> {
    this.api.patch('bookings', row.id, { status }).subscribe({
      next: () => { this.loadResource('bookings'); this.presentToast(`Booking marked ${status}`, 'success'); },
      error: () => this.presentToast('Could not update booking', 'danger'),
    });
  }

  labelFor(row: any, field: string): string {
    if (field === 'memberName') return row.memberName ?? 'Unknown member';
    if (field === 'className') return row.className ?? 'Unknown class';
    if (field === 'trainerName') return row.trainerName ?? 'Unassigned';
    if (field === 'branchName') return row.branchName ?? 'Unknown branch';
    return row[field] ?? '—';
  }

  displayDate(value: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  displayTime(value: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  private buildFields(section: Section): FieldConfig[] {
    const options = (resource: string, labelKey: string, valueKey = 'id') =>
      (this.data[resource] ?? []).map((row) => ({ label: row[labelKey] ?? `${row.firstName} ${row.lastName}`, value: row[valueKey] }));
    if (section === 'members') return [
      { name: 'firstName', label: 'First name', type: 'text', required: true, placeholder: 'Alex' },
      { name: 'lastName', label: 'Last name', type: 'text', required: true, placeholder: 'Martinez' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'alex@example.com' },
      { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+1 555 000 0000' },
      { name: 'address', label: 'Address', type: 'text', span: 2 },
      { name: 'isActive', label: 'Active member', type: 'toggle' },
    ];
    if (section === 'trainers') return [
      { name: 'firstName', label: 'First name', type: 'text', required: true },
      { name: 'lastName', label: 'Last name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'specialization', label: 'Specialization', type: 'text', required: true },
      { name: 'branchId', label: 'Home branch', type: 'select', required: true, options: options('branches', 'name') },
      { name: 'bio', label: 'Bio', type: 'textarea', span: 2 },
      { name: 'isActive', label: 'Active trainer', type: 'toggle' },
    ];
    if (section === 'branches') return [
      { name: 'name', label: 'Branch name', type: 'text', required: true, span: 2 },
      { name: 'address', label: 'Address', type: 'text', required: true, span: 2 },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'capacity', label: 'Capacity', type: 'number', required: true },
      { name: 'isActive', label: 'Active branch', type: 'toggle' },
    ];
    if (section === 'classes') return [
      { name: 'name', label: 'Class name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['Yoga', 'HIIT', 'Strength', 'Cardio', 'Pilates', 'CrossFit', 'Boxing'].map(v => ({ label: v, value: v })) },
      { name: 'durationMinutes', label: 'Duration (min)', type: 'number', required: true },
      { name: 'maxCapacity', label: 'Max capacity', type: 'number', required: true },
      { name: 'difficultyLevel', label: 'Difficulty', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'].map(v => ({ label: v, value: v })) },
      { name: 'isActive', label: 'Active class', type: 'toggle' },
      { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    ];
    if (section === 'schedule') return [
      { name: 'classId', label: 'Class', type: 'select', required: true, options: options('classes', 'name'), span: 2 },
      { name: 'trainerId', label: 'Trainer', type: 'select', required: true, options: options('trainers', 'email') },
      { name: 'branchId', label: 'Branch', type: 'select', required: true, options: options('branches', 'name') },
      { name: 'startTime', label: 'Start time', type: 'datetime-local', required: true },
      { name: 'endTime', label: 'End time', type: 'datetime-local', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['scheduled', 'cancelled', 'completed'].map(v => ({ label: v, value: v })) },
      { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
    ];
    if (section === 'bookings') return [
      { name: 'memberId', label: 'Member', type: 'select', required: true, options: options('members', 'email'), span: 2 },
      { name: 'scheduleId', label: 'Class session', type: 'select', required: true, options: options('schedules', 'className'), span: 2 },
      { name: 'status', label: 'Status', type: 'select', options: ['confirmed', 'attended', 'no-show', 'cancelled'].map(v => ({ label: v, value: v })) },
      { name: 'notes', label: 'Notes', type: 'textarea', span: 2 },
    ];
    if (section === 'payments') return [
      { name: 'memberId', label: 'Member', type: 'select', required: true, options: options('members', 'email') },
      { name: 'amount', label: 'Amount ($)', type: 'number', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['membership', 'class', 'personal_training', 'other'].map(v => ({ label: v, value: v })) },
      { name: 'method', label: 'Method', type: 'select', options: ['credit_card', 'bank_transfer', 'cash', 'online'].map(v => ({ label: v, value: v })) },
      { name: 'status', label: 'Status', type: 'select', options: ['completed', 'pending', 'failed', 'refunded'].map(v => ({ label: v, value: v })) },
    ];
    if (section === 'memberships') return [
      { name: 'memberId', label: 'Member', type: 'select', required: true, options: options('members', 'email') },
      { name: 'planId', label: 'Plan', type: 'select', required: true, options: options('membership-plans', 'name') },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'cancelled', 'pending'].map(v => ({ label: v, value: v })) },
    ];
    return [
      { name: 'name', label: 'Plan name', type: 'text', required: true, span: 2 },
      { name: 'description', label: 'Description', type: 'textarea', span: 2 },
      { name: 'durationDays', label: 'Duration (days)', type: 'number', required: true },
      { name: 'price', label: 'Price ($)', type: 'number', required: true },
      { name: 'maxClassesPerMonth', label: 'Classes / month', type: 'number' },
      { name: 'isActive', label: 'Active plan', type: 'toggle' },
    ];
  }

  private buildForm(fields: FieldConfig[], values: any = {}): FormGroup {
    const controls: Record<string, FormControl> = {};
    fields.forEach((field) => {
      const initial = values[field.name] ?? (field.type === 'toggle' ? true : field.type === 'number' ? 0 : '');
      const validators = field.required ? [Validators.required] : [];
      controls[field.name] = this.fb.control(initial, validators);
    });
    return this.fb.group(controls);
  }

  private normalizePayload(values: any): any {
    const numeric = ['id', 'branchId', 'classId', 'trainerId', 'memberId', 'scheduleId', 'planId', 'capacity', 'durationMinutes', 'maxCapacity', 'durationDays', 'maxClassesPerMonth', 'amount'];
    const result = { ...values };
    numeric.forEach((key) => { if (result[key] !== '' && result[key] != null) result[key] = Number(result[key]); });
    return result;
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2200, color, position: 'bottom' });
    await toast.present();
  }
}