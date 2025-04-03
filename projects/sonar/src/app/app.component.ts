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
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TranslateService as CoreTranslateService } from '@rero/ng-core';
import { AppConfigService } from './app-config.service';

@Component({
    selector: 'sonar-root',
    templateUrl: './app.component.html',
    standalone: false
})
export class AppComponent implements OnInit {

  /**
   * Constructor.
   * @param _translateService TranslateService.
   * @param _coreTranslateService CoreTranslateService.
   * @param _configService AppConfigService.
   */
  constructor(
    private _translateService: TranslateService,
    private _coreTranslateService: CoreTranslateService,
    private _configService: AppConfigService
  ) {}

  /**
   * Component init hook.
   */
  ngOnInit() {
    // Ex: <html lang="en" data-view="global">
    this._configService.view = document.querySelector('html').getAttribute('data-view');
    const lang = document.documentElement.lang || 'en';
    this._translateService.use(lang);
    this._coreTranslateService.setLanguage(lang);
  }

}
