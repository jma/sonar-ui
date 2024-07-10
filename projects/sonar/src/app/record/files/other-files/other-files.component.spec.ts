/*
 * SONAR User Interface
 * Copyright (C) 2019-2024 RERO
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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherFilesComponent } from './other-files.component';

describe('OtherFilesComponent', () => {
  let component: OtherFilesComponent;
  let fixture: ComponentFixture<OtherFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherFilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtherFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
