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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@rero/ng-core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { AppConfigService } from '../../app-config.service';
import { UserService } from '../../user.service';

@Component({
    selector: 'sonar-layout-admin',
    templateUrl: './admin.component.html',
    standalone: false
})
export class AdminComponent implements OnInit, OnDestroy {
  // Logged user
  user: any;

  // Application is ready?
  ready = false;

  // Navigation is collapsed?
  isCollapsed = true;

  // User subscription
  private _userSubscription: Subscription;

  /**
   * Constructor.
   *
   * @param _spinner Spinner service.
   * @param _userService User service.
   * @param _configService Config service.
   * @param _translateService: Translate service.
   */
  constructor(
    private _spinner: NgxSpinnerService,
    private _userService: UserService,
    private _configService: AppConfigService,
    private _translateService: TranslateService,
    private _httpClient: HttpClient
  ) {}

  /**
   * Administration menu entries
   *
   * @returns List of available entries in the admin menu.
   */
  get administrationMenu(): string[] {
    let sections = ['collections', 'organisations', 'subdivisions', 'users'];
    /** Delete menu entries if the organization is shared */
    if (!(this._userService.isDedecatedOrganisation())) {
      sections = ['organisations', 'users'];
    }
    return sections;
  }

  /**
   * Get current language
   *
   * @returns current language.
   */
  get currentLanguage(): string {
    return this._translateService.currentLanguage;
  }

  /**
   * Return the link to public interface, depending on user's organisation.
   *
   * @returns Link to public interface.
   */
  get publicInterfaceLink(): string {
    return this._userService.getPublicInterfaceLink();
  }

  /**
   * Return the list of available languages.
   *
   * @returns List of languages.
   */
  get languages(): Array<{ code: string; bibCode: string }> {
    return this._configService.languagesMap;
  }

  /**
   * Component initialization.
   *
   * Get the logged user and flag application as ready when he is retrieved.
   */
  ngOnInit() {
    this._spinner.show();

    this._userSubscription = this._userService.user$.subscribe(
      (user) => {
        if (user !== null) {
          this.user = user;
          this._spinner.hide();
          this.ready = true;
        }
      },
      () => {
        this._spinner.hide();
        this.ready = true;
      }
    );
  }

  /**
   * Component destruction
   */
  ngOnDestroy() {
    this._userSubscription.unsubscribe();
  }

  /**
   * Change language.
   *
   * @param languageCode 2 digit language code.
   */
  changeLanguage(languageCode: string) {
    this._translateService.setLanguage(languageCode);
    this._changeFlaskLanguage(languageCode);
  }

  /**
   * Change language on frontend flask.
   *
   * @param languageCode 2 digit language code.
   */
  private _changeFlaskLanguage(languageCode: string): void {
    this._httpClient
      .get(`/lang/${languageCode}`, { responseType: 'text' })
        .subscribe();
  }
}
