/*
 * SONAR User Interface
 * Copyright (C) 2021 RERO
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CoreModule } from '@rero/ng-core';
import { of } from 'rxjs';
import { AppConfigService } from './app-config.service';
import { AppTranslateLoader } from './app-translate-loader';
import { UserService } from './user.service';

describe('AppTranslateLoader', () => {

  let appTranslateLoader: AppTranslateLoader;

  let translateService: TranslateService;

  const appConfigServiceSpy = jasmine.createSpyObj('AppConfigService', ['']);
  appConfigServiceSpy.languagesMap = [
    { code: 'en', bibCode: 'eng' },
    { code: 'fr', bibCode: 'fre' },
    { code: 'de', bibCode: 'ger' },
    { code: 'it', bibCode: 'ita' }
  ];
  appConfigServiceSpy.translationsURLs = [
    '/assets/i18n/${lang}.json',
  ];

  const userServiceSpy = jasmine.createSpyObj('UserService', ['']);
  userServiceSpy.user$ = of({
    organisation: {
      documentsCustomField1: { includeInFacets: false, label: [
        { language: 'fre', value: 'Custom fre 1' },
        { language: 'eng', value: 'Custom eng 1' }
      ]},
      documentsCustomField2: { includeInFacets: false },
      documentsCustomField3: { includeInFacets: false }
    }
  });

  const httpClientSpy = jasmine.createSpyObj('httpClient', ['get']);
  httpClientSpy.get.and.returnValue(of({
    'Custom field 1': 'Custom field 1',
    'Custom field 2': 'Custom field 2',
    'Custom field 3': 'Custom field 3'
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({
    declarations: [],
    imports: [CoreModule,
        TranslateModule.forRoot()],
    providers: [
        TranslateService,
        { provide: AppConfigService, useValue: appConfigServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: HttpClient, useValue: httpClientSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    appTranslateLoader = TestBed.inject(AppTranslateLoader);
    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create an instance', () => {
    expect(appTranslateLoader).toBeTruthy();
  });

  it('should return the modified french translation dictionary', () => {
    translateService.use('fr');
    appTranslateLoader.getTranslation('fr').subscribe((dict: any) => {
      const customF1Key = 'Custom field 1';
      expect(dict[customF1Key]).toBe('Custom fre 1');
    });
  });

  it('should return the modified english translation dictionary', () => {
    translateService.use('en');
    appTranslateLoader.getTranslation('en').subscribe((dict: any) => {
      const customF1Key = 'Custom field 1';
      expect(dict[customF1Key]).toBe('Custom eng 1');
    });
  });

  it('should return the modified german translation dictionary with the first value in the custom array', () => {
    translateService.use('de');
    appTranslateLoader.getTranslation('de').subscribe((dict: any) => {
      const customF1Key = 'Custom field 1';
      expect(dict[customF1Key]).toBe('Custom fre 1');
    });
  });
});
