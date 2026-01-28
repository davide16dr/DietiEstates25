import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyDetailPage } from './property-detail.page';

describe('PropertyDetailPage', () => {
  let component: PropertyDetailPage;
  let fixture: ComponentFixture<PropertyDetailPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyDetailPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyDetailPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
