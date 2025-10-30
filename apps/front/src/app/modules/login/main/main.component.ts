import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Компонент основного лейаута приложения. Содержит хедер приложения и аутлет для роутов.
 * Инициализирует в себе общие сервисы.
 */
@Component({
  selector: 'pp-main',
  imports: [RouterOutlet],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {}
