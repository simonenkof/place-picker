import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { TuiAppearance, TuiTitle } from '@taiga-ui/core';
import { TuiCardLarge, TuiHeader } from '@taiga-ui/layout';
import { combineLatest } from 'rxjs';
import { TableComponent } from '../../components/table/table.component';
import { Desk } from '../../models/api/desks';
import { DesksService } from '../../services/desks.service';
import { ReservationService } from '../../services/reservation.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'pp-reservations',
  imports: [TableComponent, TuiAppearance, TuiCardLarge, TuiTitle, TuiHeader, RouterOutlet],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent implements OnInit {
  protected desks = signal<Desk[]>([]);

  protected readonly desksService = inject(DesksService);

  // Комната 1 - первая группа (Table 1-12)
  protected mainOfficeGroup1 = computed(() => this.desks().slice(0, 12));

  // Комната 1 - вторая группа (Table 13-24)
  protected mainOfficeGroup2 = computed(() => this.desks().slice(12, 24));

  // Комната 2 - первая группа (Table 25-32)
  protected secondOfficeGroup1 = computed(() => this.desks().slice(24, 32));

  // Комната 2 - отдельный стол (Table 33)
  protected secondOfficeLonely = computed(() => this.desks().slice(32, 33));

  // Комната 2 - вторая группа (Table 34-39)
  protected secondOfficeGroup2 = computed(() => this.desks().slice(33, 39));

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly reservationService = inject(ReservationService);

  ngOnInit() {
    this.loadDesks();
    this.desksService.updateDesks();
    this.reservationService.getUserReservations().subscribe();
  }

  private loadDesks() {
    combineLatest([this.desksService.getDesks(), this.userService.getUser(), this.reservationService.getUserReservations()]).subscribe(
      ([desks, user, myReservations]) => {
        const userId = user?.id ?? null;
        const myDeskIds = new Set(myReservations.map((r) => r.deskId));

        const desksWithReservedByMe = desks.map((desk) => ({
          ...desk,
          reservedByMe: userId !== null && myDeskIds.has(desk.id),
        }));

        this.desks.set(desksWithReservedByMe.sort((a, b) => a.name.localeCompare(b.name)));
      },
    );
  }

  protected splitIntoColumns<T>(items: T[], itemsPerColumn: number): [T[], T[]] {
    const firstColumn = items.slice(0, itemsPerColumn);
    const secondColumn = items.slice(itemsPerColumn);
    return [firstColumn, secondColumn];
  }

  protected openReserveViewDialog(deskId: string) {
    this.router.navigate([deskId], { relativeTo: this.route });
  }
}
