import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { GymClassService } from '../../services/gym-class.service';
import { GymClass } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './classes.page.html',
  styleUrls: ['./classes.page.scss'],
})
export class ClassesPage implements OnInit {
  private readonly classService = inject(GymClassService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  classes: GymClass[] = [];
  search = '';
  loading = true;
  modalOpen = false;
  editingClass: GymClass | null = null;
  saving = false;

  readonly fields: FieldConfig[] = [
    { name: 'name', label: 'Class Name', type: 'text', placeholder: 'HIIT Blast', required: true },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'Strength', value: 'Strength' },
        { label: 'Cardio', value: 'Cardio' },
        { label: 'Yoga & Pilates', value: 'Yoga' },
        { label: 'HIIT', value: 'HIIT' },
        { label: 'Boxing / Combat', value: 'Combat' },
      ],
      required: true,
    },
    { name: 'durationMinutes', label: 'Duration (Minutes)', type: 'number', placeholder: '45', required: true },
    { name: 'maxCapacity', label: 'Max Capacity', type: 'number', placeholder: '20', required: true },
    {
      name: 'difficultyLevel',
      label: 'Difficulty',
      type: 'select',
      options: [
        { label: 'All Levels', value: 'All Levels' },
        { label: 'Beginner', value: 'Beginner' },
        { label: 'Intermediate', value: 'Intermediate' },
        { label: 'Advanced', value: 'Advanced' },
      ],
    },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'High intensity interval training...', span: 2 },
    { name: 'isActive', label: 'Active Status', type: 'toggle' },
  ];

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.loading = true;
    this.classService.getClasses().subscribe({
      next: (res) => {
        this.classes = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load classes', 'danger');
      },
    });
  }

  get filteredClasses(): GymClass[] {
    if (!this.search.trim()) return this.classes;
    const q = this.search.toLowerCase();
    return this.classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.difficultyLevel && c.difficultyLevel.toLowerCase().includes(q))
    );
  }

  openCreate(): void {
    this.editingClass = null;
    this.modalOpen = true;
  }

  openEdit(gymClass: GymClass): void {
    this.editingClass = gymClass;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingClass = null;
  }

  saveClass(formData: Record<string, any>): void {
    this.saving = true;
    const payload = {
      ...formData,
      durationMinutes: Number(formData['durationMinutes']),
      maxCapacity: Number(formData['maxCapacity']),
    };

    if (this.editingClass) {
      this.classService.updateClass(this.editingClass.id, payload).subscribe({
        next: (updated) => {
          this.saving = false;
          this.classes = this.classes.map((c) => (c.id === updated.id ? updated : c));
          this.closeModal();
          this.showToast('Class updated successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update class', 'danger');
        },
      });
    } else {
      this.classService.createClass(payload as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.classes.unshift(created);
          this.closeModal();
          this.showToast('Class created successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to create class', 'danger');
        },
      });
    }
  }

  async confirmDelete(gymClass: GymClass): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Class',
      message: `Are you sure you want to remove ${gymClass.name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.classService.deleteClass(gymClass.id).subscribe({
              next: () => {
                this.classes = this.classes.filter((c) => c.id !== gymClass.id);
                this.showToast('Class removed', 'success');
              },
              error: () => this.showToast('Could not delete class', 'danger'),
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
