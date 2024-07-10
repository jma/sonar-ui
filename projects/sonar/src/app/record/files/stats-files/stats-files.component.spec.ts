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

import { StatsFilesComponent } from './stats-files.component';

describe('StatsFilesComponent', () => {
  let component: StatsFilesComponent;
  let fixture: ComponentFixture<StatsFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsFilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
