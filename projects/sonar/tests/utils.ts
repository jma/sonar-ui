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
import {} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AppModule } from '../src/app/app.module';
import { DepositService } from '../src/app/deposit/deposit.service';
import { UserService } from '../src/app/user.service';

export const userTestingService = jasmine.createSpyObj('UserService', [
  'loadLoggedUser',
]);
userTestingService.loadLoggedUser.and.returnValue(of({}));
// userTestingService.user$ = of({});
userTestingService.user$ = of({
  organisation: {
    documentsCustomField1: { includeInFacets: false, label: [
      { language: 'fre', value: 'Custom fre 1' },
      { language: 'eng', value: 'Custom eng 1' }
    ]},
    documentsCustomField2: { includeInFacets: false },
    documentsCustomField3: { includeInFacets: false }
  }
});

export const depositTestingService = jasmine.createSpyObj('DepositService', [
  'getJsonSchema',
  'getFiles',
  'get',
]);
depositTestingService.getJsonSchema.and.returnValue(of({}));
depositTestingService.getFiles.and.returnValue(of({}));
depositTestingService.get.and.returnValue(of({}));

export const mockedConfiguration = {
  imports: [AppModule, HttpClientTestingModule],
  providers: [
    { provide: UserService, useValue: userTestingService },
    { provide: DepositService, useValue: depositTestingService },
  ],
};
