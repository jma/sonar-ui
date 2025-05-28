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
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { AppConfigService } from '../../app-config.service';
import { UserService } from '../../user.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateLanguageService } from '@rero/ng-core';

@Component({
  selector: 'sonar-layout-admin',
  templateUrl: './admin.component.html',
  standalone: false,
})
export class AdminComponent implements OnInit, OnDestroy {
  private translateService: TranslateService = inject(TranslateService);
  private translateLanguageService: TranslateLanguageService = inject(TranslateLanguageService);
  // Logged user
  user: any;

  // Application is ready?
  ready = false;

  // Navigation is collapsed?
  isCollapsed = true;

  items: MenuItem[] | undefined;
  userItems: MenuItem[] | undefined;

  // User subscription
  private _userSubscription: Subscription;

  /**
   * Constructor.
   *
   * @param _spinner Spinner service.
   * @param _userService User service.
   * @param _configService Config service.
   * @param translateService: Translate service.
   */
  constructor(
    private _spinner: NgxSpinnerService,
    private _userService: UserService,
    private _configService: AppConfigService,
    private _httpClient: HttpClient
  ) {}


  /**
   * Get current language
   *
   * @returns current language.
   */
  get currentLanguage(): string {
    return this.translateService.currentLang;
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
    // collections', 'organisations', 'subdivisions', 'users'
    this._spinner.show();
    this.translateService.onLangChange.subscribe({
      next: ()=> this.setMenus()
    });
    this._userSubscription = this._userService.user$.subscribe({
      next: (user) => {
        if (user !== null) {
          this.user = user;
          this._spinner.hide();
          this.ready = true;
          this.setMenus();
        }
      },
      complete: () => {
        this._spinner.hide();
        this.ready = true;
      },
    });
  }

  /** */
  setMenus() {
    this.items = [
      {
        label:  this.translateService.instant('SONAR Administration'),
        visible: this.user.is_admin,
        items: [
          {
            label: this.translateService.instant('Collections'),
            routerLink: ['/records/collections'],
            visible: this._userService.isDedecatedOrganisation()
          },
          {
            label: this.translateService.instant('Organisations'),
            routerLink: ['/records/organisations'],
          },
          {
            label:  this.translateService.instant('Subdivisions'),
            routerLink: ['/records/subdivisions'],
            visible: this._userService.isDedecatedOrganisation()
          },
          {
            label:  this.translateService.instant('Users'),
            routerLink: ['/records/users'],
          },
        ],
      },
      {
        label:  this.translateService.instant('Documents'),
        routerLink: ['/records', 'documents'],
        visible: this.user.is_moderator
      },
      {
        label:  this.translateService.instant('Research projects'),
        routerLink: ['/records', 'projects'],
        visible: this.user.is_submitter
      },
      {
        label:  this.translateService.instant('Deposits'),
        visible: this.user.is_submitter,
        items: [
          {
            label:  this.translateService.instant('Deposit a publication'),
            routerLink: ['/deposit', 'create'],
          },
          {
            label:  this.translateService.instant('Deposits'),
            routerLink: ['/records', 'deposits'],
          },
        ],
      },
      {
        separator: true,
      },
    ];
    if (this.user) {
      this.userItems = [
        {
          label: this.user
            ? `${this.user.last_name}, ${this.user.first_name}`
            : 'user',
          items: [
            {
              label:  this.translateService.instant('Public interface'),
              url: this.publicInterfaceLink,
            },
            {
              label:  this.translateService.instant('Profile'),
              url: '/users/profile',
            },
            {
              label:  this.translateService.instant('Administration'),
              url: '/manage',
              visible: this.user.is_admin
            },
            {
              label:  this.translateService.instant('Logout'),
              url: '/logout',
            },
          ],
        },
        {
          label: this.currentLanguage.toUpperCase(),
          items: this.languages.map((lang) => {
            return {
              label: this.translateLanguageService.translate(lang.bibCode),
              command: () => this.changeLanguage(lang.code),
            };
          }),
        },
      ];
    }
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
    this.translateService.use(languageCode);
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
