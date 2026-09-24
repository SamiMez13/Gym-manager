import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { TrainerService } from '../../services/trainer.service';
import { Trainer } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-trainers',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './trainers.page.html',
  styleUrls: ['./trainers.page.scss'],
})
export class TrainersPage implements OnInit {
  private readonly trainerService = inject(TrainerService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  trainers: Trainer[] = [];
  search = '';
  loading = true;
  modalOpen = false;
  editingTrainer: Trainer | null = null;
  saving = false;

  readonly fields: FieldConfig[] = [
    { name: 'firstName', label: 'First Name', type: 'text', placeholder: 'Alex', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Morgan', required: true },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'alex@example.com', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555-0200' },
    { name: 'specialization', label: 'Specialization', type: 'text', placeholder: 'HIIT, Strength & Conditioning', required: true },
    { name: 'bio', label: 'Biography', type: 'textarea', placeholder: 'Certified personal trainer with 8+ years...', span: 2 },
    { name: 'isActive', label: 'Active Status', type: 'toggle' },
  ];

  ngOnInit(): void {
    this.loadTrainers();
  }

  loadTrainers(): void {
    this.loading = true;
    this.trainerService.getTrainers().subscribe({
      next: (res) => {
        this.trainers = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load trainers', 'danger');
      },
    });
  }

  get filteredTrainers(): Trainer[] {
    if (!this.search.trim()) return this.trainers;
    const q = this.search.toLowerCase();
    return this.trainers.filter(
      (t) =>
        t.firstName.toLowerCase().includes(q) ||
        t.lastName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.specialization && t.specialization.toLowerCase().includes(q))
    );
  }

  openCreate(): void {
    this.editingTrainer = null;
    this.modalOpen = true;
  }

  openEdit(trainer: Trainer): void {
    this.editingTrainer = trainer;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingTrainer = null;
  }

  saveTrainer(formData: Record<string, any>): void {
    this.saving = true;
    if (this.editingTrainer) {
      this.trainerService.updateTrainer(this.editingTrainer.id, formData).subscribe({
        next: (updated) => {
          this.saving = false;
          this.trainers = this.trainers.map((t) => (t.id === updated.id ? updated : t));
          this.closeModal();
          this.showToast('Trainer updated successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update trainer', 'danger');
        },
      });
    } else {
      this.trainerService.createTrainer(formData as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.trainers.unshift(created);
          this.closeModal();
          this.showToast('Trainer registered successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to create trainer', 'danger');
        },
      });
    }
  }

  async confirmDelete(trainer: Trainer): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Trainer',
      message: `Are you sure you want to remove ${trainer.firstName} ${trainer.lastName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.trainerService.deleteTrainer(trainer.id).subscribe({
              next: () => {
                this.trainers = this.trainers.filter((t) => t.id !== trainer.id);
                this.showToast('Trainer removed', 'success');
              },
              error: () => this.showToast('Could not delete trainer', 'danger'),
            });
          },
        },
      ],
    });
    await alert.present();
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
