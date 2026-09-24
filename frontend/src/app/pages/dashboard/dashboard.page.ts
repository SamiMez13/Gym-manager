import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, Schedule } from '../../models';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule, AppHeaderComponent],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  readonly today = new Date();
  loading = true;
  stats: Partial<DashboardStats> = {};
  todaySchedule: Schedule[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.stats = data.stats || {};
        this.todaySchedule = data.todaySchedule || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load dashboard data', 'danger');
      },
    });
  }

  displayTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  navigateTo(path: string): void {
    this.router.navigate([`/${path}`]);
  }

  seedData(): void {
    this.dashboardService.seedData(true).subscribe({
      next: (res) => {
        this.showToast(res.message || 'Database re-seeded successfully', 'success');
        this.loadData();
      },
      error: () => this.showToast('Failed to seed database', 'danger'),
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
