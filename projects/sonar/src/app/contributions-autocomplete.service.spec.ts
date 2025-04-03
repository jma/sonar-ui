import { TestBed } from '@angular/core/testing';

import { ContributionsAutocompleteService } from './contributions-autocomplete.service';

describe('ContributionsAutocompleteService', () => {
  let service: ContributionsAutocompleteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContributionsAutocompleteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
