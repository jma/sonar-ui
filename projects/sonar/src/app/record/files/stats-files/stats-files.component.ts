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

import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ApiService } from '@rero/ng-core';

@Component({
  selector: 'sonar-stats-files',
  templateUrl: './stats-files.component.html'
})
export class StatsFilesComponent implements OnInit{
  statistics = {};

  @Input() record;
  @Input() filteredKeys: string[];

  private httpClient = inject(HttpClient);
  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.getStats();
  }
  /**
   * Get the stats corresponding to given record.
   */
  private getStats() {
    const data = {
      'record-view': {
        stat: 'record-view',
        params: {
          pid_value: this.record.pid,
          pid_type: 'doc'
        }
      },
      'file-download': {
        stat: 'file-download',
        params: {
          bucket_id: this.record._bucket
        }
      }
    };

    this.httpClient.post(`${this.apiService.getEndpointByType('stats', true)}`, data)
    .subscribe(results => {
      const statistics = {};
      if (results['file-download'] != null) {
        results['file-download'].buckets.map(
          res => statistics[res.key] = res.unique_count
        );
      }
      statistics['record-view'] = results['record-view'].unique_count;
      this.statistics = statistics;
    });
  }

}
