import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { MembershipService } from '../../services/membership.service';
import { MemberService } from '../../services/member.service';
import { Member, Membership, MembershipPlan } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './memberships.page.html',
  styleUrls: ['./memberships.page.scss'],
})
export class MembershipsPage implements OnInit {
  private readonly membershipService = inject(MembershipService);
  private readonly memberService = inject(MemberService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  memberships: Membership[] = [];
  members: Member[] = [];
  plans: MembershipPlan[] = [];

  search = '';
  loading = true;
  modalOpen = false;
  editingMembership: Membership | null = null;
  saving = false;
  fields: FieldConfig[] = [];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.membershipService.getMemberships().subscribe({
      next: (res) => {
        this.memberships = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load memberships', 'danger');
      },
    });

    this.memberService.getMembers().subscribe((m) => {
      this.members = m;
      this.buildFields();
    });

    this.membershipService.getPlans().subscribe((p) => {
      this.plans = p;
      this.buildFields();
    });
  }

  buildFields(): void {
    this.fields = [
      {
        name: 'memberId',
        label: 'Member',
        type: 'select',
        options: this.members.map((m) => ({ label: `${m.firstName} ${m.lastName}`, value: m.id })),
        required: true,
      },
      {
        name: 'planId',
        label: 'Membership Plan',
        type: 'select',
        options: this.plans.map((p) => ({ label: `${p.name} ($${p.price})`, value: p.id })),
        required: true,
      },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Expired', value: 'expired' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Pending', value: 'pending' },
        ],
        required: true,
      },
    ];
  }

  get filteredMemberships(): Membership[] {
    if (!this.search.trim()) return this.memberships;
    const q = this.search.toLowerCase();
    return this.memberships.filter(
      (m) =>
        (m.memberName && m.memberName.toLowerCase().includes(q)) ||
        (m.planName && m.planName.toLowerCase().includes(q)) ||
        m.status.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.editingMembership = null;
    this.modalOpen = true;
  }

  openEdit(membership: Membership): void {
    this.editingMembership = membership;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingMembership = null;
  }

  saveMembership(formData: Record<string, any>): void {
    this.saving = true;
    const payload = {
      ...formData,
      memberId: Number(formData['memberId']),
      planId: Number(formData['planId']),
    };

    if (this.editingMembership) {
      this.membershipService.updateMembership(this.editingMembership.id, payload).subscribe({
        next: (updated) => {
          this.saving = false;
          this.memberships = this.memberships.map((m) => (m.id === updated.id ? updated : m));
          this.closeModal();
          this.showToast('Membership updated', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update membership', 'danger');
        },
      });
    } else {
      this.membershipService.createMembership(payload as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.memberships.unshift(created);
          this.closeModal();
          this.showToast('Membership plan assigned', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to assign membership', 'danger');
        },
      });
    }
  }

  async confirmDelete(membership: Membership): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Membership',
      message: `Delete membership for ${membership.memberName || 'member'}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.membershipService.deleteMembership(membership.id).subscribe({
              next: () => {
                this.memberships = this.memberships.filter((m) => m.id !== membership.id);
                this.showToast('Membership deleted', 'success');
              },
              error: () => this.showToast('Could not delete membership', 'danger'),
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
