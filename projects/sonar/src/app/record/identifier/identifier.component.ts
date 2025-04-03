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
import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppConfigService } from '../../app-config.service';

/**
 * Component that display an identifier.
 */
@Component({
    selector: 'sonar-record-identifier',
    templateUrl: './identifier.component.html',
    standalone: false
})
export class IdentifierComponent implements OnInit {
  /** Type of field (agent, identifiedBy) */
  @Input()
  type: string;

  /** Identifier values */
  @Input()
  data: { type: string, value: string, source?: string };

  /** Processed identifier */
  private _identifier: Identifier;

  /** Return processed identifier data */
  get identifier(): Identifier {
    return this._identifier;
  }

  /** Return the title link for external url */
  get externalLinkText(): string {
    return this._translateService.instant('External link to the source');
  }

  /**
   * Constructor.
   *
   * @param _appConfigService: AppConfigService
   * @param _translateService: TranslateService
   */
  constructor(
    private _appConfigService: AppConfigService,
    private _translateService: TranslateService
  ) {}

  /** OnInit Hook */
  ngOnInit(): void {
    this._processData();
  }

  /** Process data */
  private _processData(): void {
    const settings = this._appConfigService.settings.document_identifier_link;
    this._identifier = {
      field: this.type,
      type: this.data.type,
      value: this.data.value
    };
    if (this.data.type in settings) {
      const source = this.data.source ? this.data.source.toLowerCase() : 'default';
      this._identifier.source = this.data.source;
      if (source in settings[this.data.type]) {
        this._identifier.link = settings[this.data.type][source]
          .replace('_identifier_', this.data.value);
      }
    }
  }
}

interface Identifier {
  field: string;
  type: string;
  value: string;
  source?: string;
  link?: string;
}
