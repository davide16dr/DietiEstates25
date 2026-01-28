import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookVisitModalComponent } from './book-visit-modal.component';

describe('BookVisitModalComponent', () => {
  let component: BookVisitModalComponent;
  let fixture: ComponentFixture<BookVisitModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookVisitModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookVisitModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
