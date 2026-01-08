import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikesNumberComponent } from './likes-number.component';

describe('LikesNumberComponent', () => {
  let component: LikesNumberComponent;
  let fixture: ComponentFixture<LikesNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikesNumberComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LikesNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
