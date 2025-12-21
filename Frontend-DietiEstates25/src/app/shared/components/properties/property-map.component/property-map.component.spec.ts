import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyMapComponent } from './property-map.component';

describe('PropertyMapComponent', () => {
  let component: PropertyMapComponent;
  let fixture: ComponentFixture<PropertyMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyMapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
