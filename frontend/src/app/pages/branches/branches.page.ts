import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { BranchService } from '../../services/branch.service';
import { Branch } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './branches.page.html',
  styleUrls: ['./branches.page.scss'],
})
export class BranchesPage implements OnInit {
  private readonly branchService = inject(BranchService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  branches: Branch[] = [];
  search = '';
  loading = true;
  modalOpen = false;
  editingBranch: Branch | null = null;
  saving = false;

  readonly fields: FieldConfig[] = [
    { name: 'name', label: 'Branch Name', type: 'text', placeholder: 'Downtown Center', required: true },
    { name: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, City', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555-0300' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'downtown@gymhub.com' },
    { name: 'capacity', label: 'Max Facility Capacity', type: 'number', placeholder: '150' },
    { name: 'isActive', label: 'Active Status', type: 'toggle' },
  ];

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading = true;
    this.branchService.getBranches().subscribe({
      next: (res) => {
        this.branches = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load branches', 'danger');
      },
    });
  }

  get filteredBranches(): Branch[] {
    if (!this.search.trim()) return this.branches;
    const q = this.search.toLowerCase();
    return this.branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.email && b.email.toLowerCase().includes(q))
    );
  }

  openCreate(): void {
    this.editingBranch = null;
    this.modalOpen = true;
  }

  openEdit(branch: Branch): void {
    this.editingBranch = branch;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingBranch = null;
  }

  saveBranch(formData: Record<string, any>): void {
    this.saving = true;
    const payload = {
      ...formData,
      capacity: formData['capacity'] ? Number(formData['capacity']) : undefined,
    };

    if (this.editingBranch) {
      this.branchService.updateBranch(this.editingBranch.id, payload).subscribe({
        next: (updated) => {
          this.saving = false;
          this.branches = this.branches.map((b) => (b.id === updated.id ? updated : b));
          this.closeModal();
          this.showToast('Branch updated successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update branch', 'danger');
        },
      });
    } else {
      this.branchService.createBranch(payload as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.branches.unshift(created);
          this.closeModal();
          this.showToast('Branch added successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to create branch', 'danger');
        },
      });
    }
  }

  async confirmDelete(branch: Branch): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Branch',
      message: `Are you sure you want to remove ${branch.name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.branchService.deleteBranch(branch.id).subscribe({
              next: () => {
                this.branches = this.branches.filter((b) => b.id !== branch.id);
                this.showToast('Branch removed', 'success');
              },
              error: () => this.showToast('Could not delete branch', 'danger'),
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
