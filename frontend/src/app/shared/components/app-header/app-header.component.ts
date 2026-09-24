import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
})
export class AppHeaderComponent {
  @Input() title = '';
  @Input() eyebrow = 'OPERATIONS';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Input() actionIcon = 'add-outline';
  @Input() showAction = true;

  @Output() actionClick = new EventEmitter<void>();

  onAction(): void {
    this.actionClick.emit();
  }
}
