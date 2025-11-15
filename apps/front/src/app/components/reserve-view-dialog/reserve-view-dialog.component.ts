import { ChangeDetectionStrategy, Component, effect, inject, model, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TuiDay } from '@taiga-ui/cdk/date-time';
import { TuiDialog, TuiTextfield } from '@taiga-ui/core';
import { TuiTabs } from '@taiga-ui/kit';
import { TuiInputDateModule } from '@taiga-ui/legacy';
import { filter } from 'rxjs';
import { Desk } from '../../models/api/desks';
import { DesksService } from '../../services/desks.service';
import { ReservationTab, ReservePickerComponent } from '../reserve-picker/reserve-picker.component';

type DateForm = {
  date: FormControl<TuiDay>;
};

@Component({
  selector: 'pp-reserve-view-dialog',
  imports: [TuiDialog, TuiTabs, ReservePickerComponent, FormsModule, TuiTextfield, ReactiveFormsModule, TuiInputDateModule],
  templateUrl: './reserve-view-dialog.component.html',
  styleUrl: './reserve-view-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReserveViewDialogComponent implements OnInit {
  opened = model<boolean>(true);

  protected dateForm = new FormGroup<DateForm>({
    date: new FormControl<TuiDay>(TuiDay.currentLocal(), { nonNullable: true }),
  });

  protected activeItemIndex = model<ReservationTab>(ReservationTab.Hour);
  protected desk = model<Desk>(new Desk({}));

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly desksService = inject(DesksService);

  constructor() {
    effect(() => {
      if (!this.opened()) {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
  }

  ngOnInit() {
    this.loadDesk();
  }

  private loadDesk() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.desksService
        .getDeskById(id)
        .pipe(filter(Boolean))
        .subscribe((desk) => {
          if (desk) {
            this.desk.set(desk);
          }
        });
    }
  }
}
