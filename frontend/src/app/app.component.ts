import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { path: '/members', label: 'Members', icon: 'people-outline' },
    { path: '/memberships', label: 'Memberships', icon: 'ribbon-outline' },
    { path: '/trainers', label: 'Trainers', icon: 'barbell-outline' },
    { path: '/classes', label: 'Classes', icon: 'fitness-outline' },
    { path: '/schedule', label: 'Schedule', icon: 'calendar-outline' },
    { path: '/bookings', label: 'Bookings', icon: 'clipboard-outline' },
    { path: '/payments', label: 'Payments', icon: 'card-outline' },
    { path: '/branches', label: 'Branches', icon: 'business-outline' },
  ];
}