import { Component } from '@angular/core';
import { TuiAppearance, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { TableComponent } from '../../components/table/table.component';

@Component({
  selector: 'stol-reservations',
  imports: [TableComponent, TuiAppearance, TuiCardLarge, TuiTitle, TuiHeader],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent {}
