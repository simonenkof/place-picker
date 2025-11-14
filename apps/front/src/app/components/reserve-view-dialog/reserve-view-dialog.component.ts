import { Component, effect, inject, model, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TuiDialog } from '@taiga-ui/core';

@Component({
  selector: 'pp-reserve-view-dialog',
  imports: [TuiDialog],
  templateUrl: './reserve-view-dialog.component.html',
  styleUrl: './reserve-view-dialog.component.css',
})
export class ReserveViewDialogComponent implements OnInit {
  opened = model<boolean>(true);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (!this.opened()) {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Desk ID:', id);
  }
}
