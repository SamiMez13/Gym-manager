import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { PaymentService } from '../../services/payment.service';
import { MemberService } from '../../services/member.service';
import { Member, Payment } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { EntityModalComponent, FieldConfig } from '../../shared/components/entity-modal/entity-modal.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppHeaderComponent, EntityModalComponent],
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss'],
})
export class PaymentsPage implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly memberService = inject(MemberService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  payments: Payment[] = [];
  members: Member[] = [];

  search = '';
  loading = true;
  modalOpen = false;
  editingPayment: Payment | null = null;
  saving = false;
  fields: FieldConfig[] = [];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.paymentService.getPayments().subscribe({
      next: (res) => {
        this.payments = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load payments', 'danger');
      },
    });

    this.memberService.getMembers().subscribe((m) => {
      this.members = m;
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
      { name: 'amount', label: 'Amount ($)', type: 'number', placeholder: '49.99', required: true },
      {
        name: 'type',
        label: 'Payment Type',
        type: 'select',
        options: [
          { label: 'Membership Plan', value: 'membership' },
          { label: 'Drop-In Session', value: 'drop-in' },
          { label: 'Personal Training', value: 'personal-training' },
          { label: 'Merchandise / Supplement', value: 'merchandise' },
        ],
        required: true,
      },
      {
        name: 'method',
        label: 'Payment Method',
        type: 'select',
        options: [
          { label: 'Credit Card', value: 'credit_card' },
          { label: 'Cash', value: 'cash' },
          { label: 'Bank Transfer', value: 'bank_transfer' },
          { label: 'Online / Mobile', value: 'online' },
        ],
        required: true,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Completed', value: 'completed' },
          { label: 'Pending', value: 'pending' },
          { label: 'Failed', value: 'failed' },
          { label: 'Refunded', value: 'refunded' },
        ],
        required: true,
      },
      { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Invoice reference, check #...', span: 2 },
    ];
  }

  get filteredPayments(): Payment[] {
    if (!this.search.trim()) return this.payments;
    const q = this.search.toLowerCase();
    return this.payments.filter(
      (p) =>
        (p.memberName && p.memberName.toLowerCase().includes(q)) ||
        p.type.toLowerCase().includes(q) ||
        (p.method && p.method.toLowerCase().includes(q)) ||
        p.status.toLowerCase().includes(q)
    );
  }

  openCreate(): void {
    this.editingPayment = null;
    this.modalOpen = true;
  }

  openEdit(payment: Payment): void {
    this.editingPayment = payment;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingPayment = null;
  }

  savePayment(formData: Record<string, any>): void {
    this.saving = true;
    const payload = {
      ...formData,
      memberId: Number(formData['memberId']),
      amount: Number(formData['amount']),
    };

    if (this.editingPayment) {
      this.paymentService.updatePayment(this.editingPayment.id, payload).subscribe({
        next: (updated) => {
          this.saving = false;
          this.payments = this.payments.map((p) => (p.id === updated.id ? updated : p));
          this.closeModal();
          this.showToast('Payment record updated', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update payment', 'danger');
        },
      });
    } else {
      this.paymentService.createPayment(payload as any).subscribe({
        next: (created) => {
          this.saving = false;
          this.payments.unshift(created);
          this.closeModal();
          this.showToast('Payment recorded successfully', 'success');
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to record payment', 'danger');
        },
      });
    }
  }

  async confirmDelete(payment: Payment): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete Payment',
      message: `Delete payment record of $${payment.amount}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.paymentService.deletePayment(payment.id).subscribe({
              next: () => {
                this.payments = this.payments.filter((p) => p.id !== payment.id);
                this.showToast('Payment deleted', 'success');
              },
              error: () => this.showToast('Could not delete payment', 'danger'),
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
