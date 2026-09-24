import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { MemberService } from '../../services/member.service';
import { Member } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
})
export class MembersPage implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  members: Member[] = [];
  search = '';
  loading = true;
  modalOpen = false;
  editingMember: Member | null = null;
  saving = false;

  readonly fields: FieldConfig[] = [
    { name: 'firstName', label: 'First Name', type: 'text', placeholder: 'Jane', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe', required: true },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com', required: true },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555-0100' },
    { name: 'emergencyContact', label: 'Emergency Contact', type: 'text', placeholder: 'John Doe (+1 555-0199)' },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Member preferences, allergies, goals...', span: 2 },
    { name: 'isActive', label: 'Active Status', type: 'toggle' },
  ];

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.memberService.getMembers().subscribe({
      next: (res) => {
        this.members = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load members', 'danger');
      },
    });
  }

  get filteredMembers(): Member[] {
    if (!this.search.trim()) return this.members;
    const q = this.search.toLowerCase();
    return this.members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q))
    );
  }

  openCreate(): void {
    this.editingMember = null;
    this.modalOpen = true;
  }

  openEdit(member: Member): void {
    this.editingMember = member;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingMember = null;
  }

  saveMember(formData: Record<string, any>): void {
    this.saving = true;
    if (this.editingMember) {
      this.memberService.updateMember(this.editingMember.id, formData).subscribe({
        next: (updated) => {
          this.saving = false;
          this.members = this.members.map((m) => (m.id === updated.id ? updated : m));
          this.closeModal();
          this.showToast('Member updated successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update member', 'danger');
        },
      });
    } else {
      this.memberService.createMember(formData as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.members.unshift(created);
          this.closeModal();
          this.showToast('Member registered successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to create member', 'danger');
        },
      });
    }
  }

  async confirmDelete(member: Member): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Member',
      message: `Are you sure you want to remove ${member.firstName} ${member.lastName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.memberService.deleteMember(member.id).subscribe({
              next: () => {
                this.members = this.members.filter((m) => m.id !== member.id);
                this.showToast('Member removed', 'success');
              },
              error: () => this.showToast('Could not delete member', 'danger'),
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
