import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertiesPageComponent } from './properties-page.component';

describe('PropertiesPageComponent', () => {
  let component: PropertiesPageComponent;
  let fixture: ComponentFixture<PropertiesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertiesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertiesPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
