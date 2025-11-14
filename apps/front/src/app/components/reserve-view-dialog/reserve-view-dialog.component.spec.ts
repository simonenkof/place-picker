import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReserveViewDialogComponent } from './reserve-view-dialog.component';

describe('ReserveViewDialogComponent', () => {
  let component: ReserveViewDialogComponent;
  let fixture: ComponentFixture<ReserveViewDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReserveViewDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReserveViewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
