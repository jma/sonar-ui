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
import { Component, OnInit, inject } from '@angular/core';
import { RecordService } from '@rero/ng-core';
import { combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  templateUrl: './detail.component.html',
})
export class DetailComponent implements OnInit {
  /** Observable resolving record data */
  record$: Observable<any>;

  /** Organisation record. */
  record: any;

  recordService = inject(RecordService);

  /** Subdivisions list. */
  subdivisions: Array<any> = [];

  /** Collections list. */
  collections: Array<any> = [];

  /**
   * Constructor.
   *
   * @param _recordService: Record service.
   */
  constructor() {}

  /**
   * Component init.
   *
   * Load the collections and subdivisions for the organisation.
   */
  ngOnInit(): void {
    this.record$
      .pipe(
        switchMap((record: any) => {
          this.record = record;
          return combineLatest([
            this.recordService.getRecords(
              'subdivisions',
              `organisation.pid:${record.id}`
            ),
            this.recordService.getRecords(
              'collections',
              `organisation.pid:${record.id}`
            ),
          ]);
        })
      )
      .subscribe((result: any) => {
        this.subdivisions = result[0].hits.hits;
        this.collections = result[1].hits.hits;
      });
  }
}
