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
import { Pipe, PipeTransform } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/**
 * Return the value of source array, corresponding of given language.
 */
@Pipe({
    name: 'languageValue',
    standalone: false
})
export class LanguageValuePipe implements PipeTransform {
  /**
   * Constructor.
   *
   * @param _translateService Translate service.
   */
  constructor(private _translateService: TranslateService) {}

  transform(value: any[], ...args: any[]): Observable<string> {
    if (!value || value.length === 0) {
      return of('');
    }

    if (!args[0]) {
      args[0] = 'value';
    }

    if (!args[1]) {
      args[1] = 'language';
    }

    const languageMap = {
      fr: 'fre',
      en: 'eng',
      de: 'ger',
      it: 'ita',
    };

    return this._translateService.onLangChange.pipe(
      startWith({ lang: this._translateService.currentLang }),
      map((event: LangChangeEvent) => {
        if (!languageMap[event.lang]) {
          return value[0][args[0]];
        }

        const itemFound = value.find(
          (element) => element[args[1]] === languageMap[event.lang]
        );

        if (itemFound) {
          return itemFound[args[0]];
        }

        return value[0][args[0]];
      })
    );
  }
}
