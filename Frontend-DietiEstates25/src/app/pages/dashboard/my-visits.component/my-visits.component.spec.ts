import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyVisitsComponent } from './my-visits.component';

describe('MyVisitsComponent', () => {
  let component: MyVisitsComponent;
  let fixture: ComponentFixture<MyVisitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyVisitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyVisitsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
