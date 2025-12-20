import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyFiltersComponent } from './property-filters.component';

describe('PropertyFiltersComponent', () => {
  let component: PropertyFiltersComponent;
  let fixture: ComponentFixture<PropertyFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyFiltersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
