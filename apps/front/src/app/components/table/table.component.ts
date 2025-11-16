import { Component, input } from '@angular/core';
import { Desk } from '../../models/api/desks';

@Component({
  selector: 'pp-table',
  imports: [],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent {
  public desk = input.required<Desk>();
  public reserved = input<boolean | null>(null);
}
