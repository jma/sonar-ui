import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwisscoveryComponent } from './swisscovery.component';

describe('SwisscoveryComponent', () => {
  let component: SwisscoveryComponent;
  let fixture: ComponentFixture<SwisscoveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwisscoveryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SwisscoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
