import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeOfferModalComponent } from './make-offer-modal.component';

describe('MakeOfferModalComponent', () => {
  let component: MakeOfferModalComponent;
  let fixture: ComponentFixture<MakeOfferModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakeOfferModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakeOfferModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
