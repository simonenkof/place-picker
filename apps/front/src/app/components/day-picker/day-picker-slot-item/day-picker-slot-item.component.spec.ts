import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DayPickerSlotItemComponent } from './day-picker-slot-item.component';

describe('DayPickerSlotItemComponent', () => {
  let component: DayPickerSlotItemComponent;
  let fixture: ComponentFixture<DayPickerSlotItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayPickerSlotItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DayPickerSlotItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
