import { KeyValuePipe, NgForOf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TUI_DOC_ICONS } from '@taiga-ui/addon-doc/tokens';
import { TuiButton, TuiDataList, TuiDropdown } from '@taiga-ui/core';
import { TuiTabs } from '@taiga-ui/kit';
import { filter, Subscription } from 'rxjs';
import { AppRoutes, ROUTES } from '../../app.routes';
import { LOCAL_STORAGE_KEYS } from '../../local-storage-keys';
import { AppTheme, ThemeService } from '../../services/theme.service';

const TabName = {
  Reserve: 'Бронирование',
  MyReservations: 'Мои брони',
} as const;
export type TabName = (typeof TabName)[keyof typeof TabName];

type Tabs = {
  id: number;
  name: TabName;
};

@Component({
  selector: 'pp-header',
  imports: [NgForOf, TuiButton, TuiDataList, TuiDropdown, TuiTabs, KeyValuePipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit, OnDestroy {
  protected readonly tabNames = new Map<AppRoutes, Tabs>([
    [ROUTES.Reservations, { id: 0, name: TabName.Reserve }],
    [ROUTES.MyReservarions, { id: 1, name: TabName.MyReservations }],
  ]);

  protected isProfileDialogOpen = false;
  protected activeElement = signal(this.tabNames.get(ROUTES.Reservations));
  protected routerSubscription: Subscription | null = null;

  protected readonly AppTheme = AppTheme;

  protected readonly icons = inject(TUI_DOC_ICONS);
  protected readonly darkMode = signal(localStorage.getItem(LOCAL_STORAGE_KEYS.selectedTheme) === AppTheme.Dark);
  protected readonly icon = computed(() => (this.darkMode() ? this.icons.light : this.icons.dark));

  protected readonly themeService = inject(ThemeService);
  protected readonly router = inject(Router);

  ngOnInit() {
    setTimeout(() => {
      const route = this.router.url.slice(1);
      this.checkAndUpdateRoute(route);
    });

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => this.checkAndUpdateRoute(event.url.slice(1)));
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  /**
   * Проверяет роут и редиректит в него, если роут валиден.
   * @param {unknown} route - Что-то.
   */
  protected checkAndUpdateRoute(route: unknown) {
    if (this.isRoute(route)) {
      this.updateRoute(route as AppRoutes);
    }
  }

  /**
   * Обновляет активную вкладку и изменят роут.
   * @param {AppRoutes} route - Роут.
   */
  protected updateRoute(route: AppRoutes) {
    const targetTab = this.tabNames.get(route);

    if (targetTab && this.isRoute(route)) {
      this.activeElement.set(targetTab);
      this.router.navigate([route]);
    }
  }

  /**
   * Проверяет является ли аргумент роутом.
   * @param {unknow} route - Что-то.
   * @returns {boolean}
   */
  protected isRoute(route: unknown): route is AppRoutes {
    return Object.values(ROUTES).includes(route as AppRoutes);
  }
}
