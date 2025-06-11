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
import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConfigService } from './app-config.service';
import { UserService } from './user.service';
import { DOCUMENT } from '@angular/common';

@Component({
    selector: 'sonar-root',
    templateUrl: './app.component.html',
    standalone: false
})
export class AppComponent implements OnInit {

  protected document:Document = inject(DOCUMENT);
  /**
   * Constructor.
   * @param _translateService TranslateService.
   * @param _coreTranslateService CoreTranslateService.
   * @param _configService AppConfigService.
   */
  constructor(
    private translateService: TranslateService,
    private appConfigService: AppConfigService,
  ) {}

  /**
   * Component init hook.
   */
  ngOnInit() {
    // TODO: retrieve the language from the logged user API
    // Ex: <html lang="en" data-view="global">
    // this.appConfigService.view = document.querySelector('html').getAttribute('data-view');
    // let language = document.documentElement.lang || 'en';
    let language = 'fr';
    if (language == null) {
      const browserLang = this.translateService.getBrowserLang();
      language = browserLang.match(this.appConfigService.languages.join('|')) ?
        browserLang : this.appConfigService.defaultLanguage;
    }

    return this.translateService.use(language);
  }

}
