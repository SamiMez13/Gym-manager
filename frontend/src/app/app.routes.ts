import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'members',
    loadComponent: () => import('./pages/members/members.page').then((m) => m.MembersPage),
  },
  {
    path: 'memberships',
    loadComponent: () => import('./pages/memberships/memberships.page').then((m) => m.MembershipsPage),
  },
  {
    path: 'trainers',
    loadComponent: () => import('./pages/trainers/trainers.page').then((m) => m.TrainersPage),
  },
  {
    path: 'classes',
    loadComponent: () => import('./pages/classes/classes.page').then((m) => m.ClassesPage),
  },
  {
    path: 'schedule',
    loadComponent: () => import('./pages/schedule/schedule.page').then((m) => m.SchedulePage),
  },
  {
    path: 'bookings',
    loadComponent: () => import('./pages/bookings/bookings.page').then((m) => m.BookingsPage),
  },
  {
    path: 'payments',
    loadComponent: () => import('./pages/payments/payments.page').then((m) => m.PaymentsPage),
  },
  {
    path: 'branches',
    loadComponent: () => import('./pages/branches/branches.page').then((m) => m.BranchesPage),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
