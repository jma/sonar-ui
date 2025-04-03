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
import { Injectable } from '@angular/core';
import { TranslateLoader as NgCoreTranslateLoader } from '@rero/ng-core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from './app-config.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AppTranslateLoader extends NgCoreTranslateLoader {

  /** App Config */
  private _config: AppConfigService;

  /**
   * Constructor
   * @param _coreConfigService -AppConfigService
   * @param _http - HttpClient
   * @param _userService - UserService
   */
  constructor(
    _coreConfigService: AppConfigService,
    _http: HttpClient,
    private _userService: UserService
  ) {
    super();
    this._config = _coreConfigService;
  }

  /**
   * Get Translation
   * @param lang - current language string
   * @returns Object translation
   */
  // getTranslation(lang: string): Observable<any> {
  //   return combineLatest([this._userService.user$, super.getTranslation(lang)]).pipe(
  //     map(([user, translation]) => {
  //       if (user) {
  //         const bibLanguage = this._config.languagesMap.find(
  //           (mapping: {code: string, bibCode: string}) => mapping.code === lang
  //         ).bibCode;
  //         [1, 2, 3].forEach((id: number) => {
  //           const key = `documentsCustomField${id}`;
  //           if ((key in user.organisation) && ('label' in user.organisation[key])) {
  //             const label = user.organisation[key].label;
  //             const entry = label.find((lab: any) => lab.language === bibLanguage);
  //             const customKey = `Custom field ${id}`;
  //             if (entry) {
  //               translation[customKey] = entry.value;
  //             } else {
  //               // If we do not have a value for the selected language,
  //               // we take the first value in the array.
  //               translation[customKey] = label[0].value;
  //             }
  //           }
  //         });
  //       }
  //       return translation;
  //     })
  //   );
  // }
}
