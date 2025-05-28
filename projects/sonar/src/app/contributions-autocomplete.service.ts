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

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService, RecordService } from '@rero/ng-core';
import { ISuggestionItem } from '@rero/ng-core/lib/record/editor/formly/primeng/remote-autocomplete/remote-autocomplete.interface';
import { IQueryOptions } from '@rero/ng-core/lib/record/editor/formly/primeng/remote-autocomplete/remote-autocomplete.interface';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContributionsAutocompleteService {

  private httpClient: HttpClient = inject(HttpClient);
  private translateService: TranslateService = inject(TranslateService);
  private apiService: ApiService = inject(ApiService);
  private recordService: RecordService = inject(RecordService);

  constructor() { }

  public getSuggestions(query: string, queryOptions: IQueryOptions = {}, currentPid: string): Observable<ISuggestionItem[]> {
    if (!query) {
      return of([]);
    }
    var url = `/api/${queryOptions.type}/?q=${queryOptions.field}:${query}`;
    if(queryOptions.type === 'documents') {
      url = `/api/suggestions/completion?resource=${queryOptions.type}&field=${queryOptions.field}&q=${query}`;
    }
    return this.httpClient.get(url).pipe(
        map((results: any) => {
          var toReturn = [];
          if(results.hits) {
            toReturn = results.hits.hits.map((hit: any) => {
              return {
                label: hit.metadata[queryOptions.label],
                value: this.apiService.getRefEndpoint(queryOptions.type, hit.id)
              };
            });
          } else {
            toReturn = results.map((hit: any) => {
            return {
              label: hit,
             value: hit
            };
          });
          }
          if(queryOptions.allowAdd == true && !results.includes(query)) {
            const label = `<span>${this.translateService.instant("New")}:</span>&nbsp;${query}`;
            toReturn.push({label: label, value: query});
          }
          return toReturn;

        }),
        catchError(e => {
          switch (e.status) {
            case 400:
              return [];
            default:
              throw e;
          }
        })
      );
  }

  getValueAsHTML(queryOptions: IQueryOptions, item: ISuggestionItem): Observable<string> {
    const url = item.value.split('/');
    if(url.length < 2) {
      return of(item.value);
    }
    const pid = url.pop();
    return this.recordService
      .getRecord(queryOptions.type, pid, 1)
      .pipe(
        map((data: any) =>{
          return `<span class="ui:p-2"><strong>${data.metadata[queryOptions.label]}</strong></span>`;
        }
        )
      );
  }
}
