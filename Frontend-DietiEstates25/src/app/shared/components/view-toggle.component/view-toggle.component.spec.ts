import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewToggleComponent } from './view-toggle.component';

describe('ViewToggleComponent', () => {
  let component: ViewToggleComponent;
  let fixture: ComponentFixture<ViewToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewToggleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewToggleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
