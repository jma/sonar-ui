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
import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { ApiService, RecordService } from '@rero/ng-core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Observable, Subscription, map } from 'rxjs';
import { AppConfigService } from '../../../app-config.service';
import { DocumentFile } from '../document.interface';

@Component({
  templateUrl: './detail.component.html'
})
export class DetailComponent implements OnDestroy, OnInit {
  /** Observable resolving record data */
  record$: Observable<any>;

  /** File to preview */
  previewFile: {
    label: string;
    url: SafeUrl;
  };

  // Show only three contributors on startup.
  contributorsLength = 3;

  // Record retrieved from observable.
  record: any = null;

  recordService = inject(RecordService);

  // Form modal reference.
  previewModalRef: BsModalRef;

  // Subscription to observables, used to unsubscribe to all at the same time.
  private _subscription: Subscription = new Subscription();

  // Reference to preview modal in template.
  @ViewChild('previewModal')
  previewModalTemplate: TemplateRef<any>;

  /**
   * Constructor.
   *
   * @param _apiService API service.
   * @param _httpClient HTTP client.
   * @param _configService Config service.
   * @param _translateService Translate service.
   * @param _sanitizer DOM sanitizer.
   * @param _modalService Modal service.
   */
  constructor(
    private _apiService: ApiService,
    private _configService: AppConfigService,
    private _httpClient: HttpClient,
    private _translateService: TranslateService,
    private _sanitizer: DomSanitizer,
    private _modalService: BsModalService
  ) {}

  /**
   * Component initialisation.
   *
   * Retrieve record from observable.
   */
  ngOnInit() {
    this.record$.subscribe((record: any) => {
      this.record = record.metadata;

      // Add property to abstracts for show more functionality.
      if (!this.record.abstracts) {
        this.record.abstracts = [];
      }
      this.sortAbstracts();
      this.record.abstracts.map((element: any, index: number) => {
        element.show = index === 0;
        element.full = false;
        return element;
      });
    });

    // When language change, abstracts are sorted and first one is displayed.
    this._subscription.add(
      this._translateService.onLangChange.subscribe(() => {
        this.sortAbstracts();
        if (this.record && this.record.abstracts.length > 0) {
          this.changeAbstract(this.record.abstracts[0]);
        }
      })
    );
  }
  updateFiles(files) {
    this.recordService.getRecord('documents', this.record.pid, 1).pipe(
      map(doc => this.record._files = doc.metadata._files)
    ).subscribe();
  }

  get filteredKeys() {
    return this.filteredFiles.map(file => file.key);
  }
  /**
   * Component destruction.
   *
   * Unsubscribe from subscribers.
   */
  ngOnDestroy() {
    this._subscription.unsubscribe();
  }

  /**
   * Get only files of type "file" (exclude fulltext and thumbnail files).
   *
   * @return List of item filtered.
   */
  get filteredFiles(): Array<any> {
    if (!this.record._files) {
      return [];
    }

    return this.record._files.filter((item: any) => {
      return item.type === 'file';
    });
  }

  /**
   * Return the document's main file.
   *
   * @returns Main file object.
   */
  get mainFile(): any {
    return this.filteredFiles.length === 0 ? null : this.filteredFiles[0];
  }

  /**
   * Return the list of UDC classifications.
   *
   * @returns List of UDC classifications.
   */
  get UDCclassifiations(): Array<any> {
    if (!this.record.classification) {
      return [];
    }

    return this.record.classification.filter((item: any) => {
      return item.type === 'bf:ClassificationUdc';
    });
  }


  /**
   * Show abstract's full text when clicking on the show more link.
   *
   * @param event DOM event triggered.
   * @param abstract Object containing abstract's data.
   */
  showMoreAbstract(event: any, abstract: any) {
    event.preventDefault();
    abstract.full = true;
  }

  /**
   * Show abstract corresponding to the clicked language.
   *
   * @param abstract Object containing abstract's data.
   */
  changeAbstract(abstract: any) {
    this.record.abstracts.forEach((element: any) => {
      element.show = false;
    });
    abstract.show = true;
  }

  /**
   * Scroll to target.
   *
   * @param event DOM event triggered.
   * @param target ID of the target element.
   */
  goToOtherFile(event: any, target: string) {
    event.preventDefault();
    document.querySelector('#' + target).scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Show a preview in modal for file.
   *
   * @param file Document file object.
   */
  showPreview(file: DocumentFile): void {
    this.previewModalRef = this._modalService.show(this.previewModalTemplate, {
      class: 'modal-lg',
    });
    this.previewFile = {
      label: file.label,
      url: this._sanitizer.bypassSecurityTrustResourceUrl(file.links.preview),
    };
  }

  /**
   * Return the formatted string for funding organisations.
   *
   * @param project Project record.
   * @returns String representing the funding organisations.
   */
  get_funding_organisations(project: any): string {
    if (!project.funding_organisations) {
      return '';
    }

    const text = project.funding_organisations.map((item: any) => {
      return item.agent.preferred_name;
    });

    return `(${this._translateService.instant(
      'supported by {{ organisations }}',
      { organisations: text.join(', ') }
    )})`;
  }

  /**
   * Sort abstracts by language prioritization. First language is the current
   * language of the interface.
   */
  private sortAbstracts() {
    if (!this.record || !this.record.abstracts) {
      return;
    }

    const abstractsLanguage = [];
    const abstractsCode = [];
    this.record.abstracts.forEach((abstract: any) => {
      if (this._configService.languagesMap.find(
        (map: { code: string; bibCode: string }) => map.bibCode === abstract.language)
      ) {
        abstractsLanguage.push(abstract);
      } else {
        abstractsCode.push(abstract);
      }
    });

    const firstLanguage = this._configService.languagesMap.find(
      (item) => item.code === this._translateService.currentLang
    );
    const languagesPriorities = [firstLanguage].concat(
      this._configService.languagesMap
    );

    this.record.abstracts = abstractsLanguage.sort((a: any, b: any) => {
      const aIndex = languagesPriorities.findIndex(
        (lang) => a.language === lang.bibCode
      );
      const bIndex = languagesPriorities.findIndex(
        (lang) => b.language === lang.bibCode
      );
      if (aIndex === bIndex) {
        return 0;
      }
      return aIndex < bIndex ? -1 : 1;
    }).concat(
      abstractsCode.sort((a: any, b: any) => a.language.localeCompare(b.language))
    );
  }
}
