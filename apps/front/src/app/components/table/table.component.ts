import { Component, input } from '@angular/core';

@Component({
  selector: 'pp-table',
  imports: [],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent {
  public name = input<string>('');
  public reserved = input<boolean>(false);
}
