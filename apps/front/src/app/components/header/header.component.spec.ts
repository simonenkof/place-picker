import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { TUI_DOC_ICONS } from '@taiga-ui/addon-doc/tokens';
import { BehaviorSubject } from 'rxjs';
import { ROUTES } from '../../app.routes';
import { ThemeService } from '../../services/theme.service';
import { HeaderComponent } from './header.component';

jest.mock('@angular/router');
jest.mock('../../services/theme.service');

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: jest.Mocked<Router>;
  const routerEvents = new BehaviorSubject<NavigationEnd>(new NavigationEnd(1, '/', '/'));

  beforeEach(async () => {
    const routerMock = {
      navigate: jest.fn(),
      events: routerEvents,
      url: '/reservations',
    } as unknown as jest.Mocked<Router>;

    const themeServiceMock = {
      changeTheme: jest.fn(),
    } as unknown as jest.Mocked<ThemeService>;

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock },
        { provide: ThemeService, useValue: themeServiceMock },
        {
          provide: TUI_DOC_ICONS,
          useValue: {
            light: 'tuiIconLightMode',
            dark: 'tuiIconDarkMode',
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router) as jest.Mocked<Router>;
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Инициализация', () => {
    it('Должен создать компонент', () => {
      expect(component).toBeTruthy();
    });

    it('Должен инициализировать tabNames с правильными значениями', () => {
      const tabNames = component['tabNames'];
      expect(tabNames.size).toBe(2);
      expect(tabNames.get(ROUTES.Reservations)).toEqual({ id: 0, name: 'Бронирование' });
      expect(tabNames.get(ROUTES.MyReservarions)).toEqual({ id: 1, name: 'Мои брони' });
    });

    it('Должен установить начальную активную вкладку при инициализации', () => {
      expect(component['activeElement']()).toEqual(component['tabNames'].get(ROUTES.Reservations));
    });
  });

  describe('Роутинг', () => {
    it('Должен вызывать router.navigate при updateRoute', () => {
      component['updateRoute'](ROUTES.MyReservarions);
      expect(router.navigate).toHaveBeenCalledWith([ROUTES.MyReservarions]);
    });

    it('Должен корректно проверять валидность маршрута', () => {
      expect(component['isRoute'](ROUTES.MyReservarions)).toBe(true);
      expect(component['isRoute']('invalid-route')).toBe(false);
    });
  });

  describe('Управление темой', () => {
    it('Должен отображать правильную иконку в зависимости от темы', () => {
      component['darkMode'].set(true);
      expect(component['icon']()).toBe('tuiIconLightMode');

      component['darkMode'].set(false);
      expect(component['icon']()).toBe('tuiIconDarkMode');
    });
  });

  describe('Отписка от подписок', () => {
    it('Должен отписываться от routerSubscription при уничтожении', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unsubscribeSpy = jest.spyOn(component['routerSubscription'] as any, 'unsubscribe');
      component.ngOnDestroy();
      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });
});
