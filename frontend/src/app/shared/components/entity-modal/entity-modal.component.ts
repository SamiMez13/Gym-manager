import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'toggle';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  required?: boolean;
  span?: 1 | 2;
}

@Component({
  selector: 'app-entity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
  templateUrl: './entity-modal.component.html',
  styleUrls: ['./entity-modal.component.scss'],
})
export class EntityModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() title = 'Item';
  @Input() isEditing = false;
  @Input() fields: FieldConfig[] = [];
  @Input() initialData: Record<string, any> | null = null;
  @Input() saving = false;

  @Output() dismiss = new EventEmitter<void>();
  @Output() save = new EventEmitter<Record<string, any>>();

  form: FormGroup = this.fb.group({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['initialData'] || changes['isOpen']) {
      this.buildForm();
    }
  }

  private buildForm(): void {
    const group: Record<string, any> = {};
    for (const field of this.fields) {
      const validators = field.required ? [Validators.required] : [];
      let val: any = '';
      if (this.initialData && this.initialData[field.name] !== undefined) {
        val = this.initialData[field.name];
      } else if (field.type === 'toggle') {
        val = true;
      }
      group[field.name] = [val, validators];
    }
    this.form = this.fb.group(group);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value);
  }

  onClose(): void {
    this.dismiss.emit();
  }
}
