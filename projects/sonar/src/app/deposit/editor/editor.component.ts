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
import { DatePipe } from '@angular/common';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyJsonschema } from '@ngx-formly/core/json-schema';
import { TranslateService } from '@ngx-translate/core';
import { ApiService, DialogService, processJsonSchema, resolve$ref, JSONSchemaService } from '@rero/ng-core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, combineLatest, of } from 'rxjs';
import { delay, first, switchMap, tap } from 'rxjs/operators';
import { UserService } from '../../user.service';
import { DepositService } from '../deposit.service';

@Component({
  selector: 'sonar-deposit-editor',
  templateUrl: './editor.component.html',
})
export class EditorComponent implements OnInit {
  /** Deposit object */
  deposit: any = null;

  /** Current user */
  user: any = null;

  /** Deposit creation date */
  createdAt: Date;

  /** Deposit modification date */
  updatedAt: Date;

  /** Current form to show */
  currentStep = 'metadata';

  /** Deposit steps */
  steps: string[] = [
    'create',
    'metadata',
    'contributors',
    'projects',
    'diffusion',
  ];

  /** Form for current type */
  form: UntypedFormGroup = new UntypedFormGroup({});

  /** Model representing data for current type */
  model: any;

  /** Form fields for current type */
  fields: any;

  /** Current view mode */
  view = 'form';

  /** File key to preview */
  previewFileKey: string;

  /** Swisscovery result */
  scResult: any = null;

  /** Store files associated with deposit */
  private _files: Array<any> = [];

  /** DOM element for swisscovery search type */
  @ViewChild('scType') scType: ElementRef;

  /** DOM element for swisscovery search query */
  @ViewChild('scQuery') scQuery: ElementRef;

  /**
   * Constructor.
   *
   * @param _toastr Toastr service.
   * @param _depositService Deposit service
   * @param _router Router service
   * @param _route Route
   * @param _formlyJsonschema Formly JSON schema.
   * @param _translateService Translate service.
   * @param _dialogService Dialog service.
   * @param _userUservice User service.
   * @param _spinner Spinner service.
   * @param _datePipe Date pipe.
   * @param _apiService API service.
   * @param _httpClient HTTP Client.
   */
  constructor(
    private _toastrService: ToastrService,
    private _depositService: DepositService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _formlyJsonschema: FormlyJsonschema,
    private _translateService: TranslateService,
    private _dialogService: DialogService,
    private _userUservice: UserService,
    private _spinner: NgxSpinnerService,
    private _datePipe: DatePipe,
    private _apiService: ApiService,
    private _httpClient: HttpClient,
    private _cd: ChangeDetectorRef,
    private _jsonschemaService: JSONSchemaService
  ) {}

  ngOnInit(): void {
    this._route.params
      .pipe(
        tap((params) => {
          this.currentStep = params.step;
        }),
        switchMap((params) => {
          return combineLatest([
            this._depositService.getJsonSchema('deposits'),
            this._depositService.get(params.id),
            this._depositService.getFiles(params.id),
            this._userUservice.user$
          ]);
        })
      )
      .subscribe(
        (result) => {
          this.user = result[3];
          this.deposit = result[1].metadata;

          this._translateCustomField();
          if (this._depositService.canAccessDeposit(this.deposit) === false) {
            this._router.navigate([
              'deposit',
              this.deposit.pid,
              'confirmation',
            ]);
          }

          this.createdAt = result[1].created;
          this.updatedAt = result[1].updated;
          this._createForm(result[0]);

          this._files = result[2];
        },
        () => {
          this._toastrService.error(
            this._translateService.instant('Deposit not found')
          );
          this._router.navigate(['deposit', '0', 'create']);
        }
      );
  }

  private _translateCustomField() {
    this._translateService.set('customField1', 'toto');
    this._cd.detectChanges();
  }

  /**
   * Return link prefix
   */
  get linkPrefix() {
    return `/deposit/${this.deposit ? this.deposit.pid : '0'}/`;
  }

  /**
   * Get max step
   */
  get maxStep() {
    return this.deposit ? this.deposit.step : 'metadata';
  }

  /** Return main file */
  get mainFile(): any {
    return this._files.find((item: any) => item.category === 'main');
  }

  /** Return additional files list */
  get additionalFiles(): Array<any> {
    return this._files.filter((item: any) => item.category === 'additional');
  }

  /** Return if current logged user is an admin or a standard user */
  get isAdminUser(): boolean {
    return this._userUservice.hasRole(['superuser', 'admin', 'moderator']);
  }

  /**
   * For displaying publication data in deposit summary
   */
  get publication() {
    const journal: Array<string> = [];

    if (this.deposit.metadata.publication.publishedIn) {
      journal.push(this.deposit.metadata.publication.publishedIn);
    }

    if (this.deposit.metadata.publication.year) {
      journal.push(this.deposit.metadata.publication.year);
    }

    if (this.deposit.metadata.publication.volume) {
      journal.push(
        [
          this._translateService.instant('vol.'),
          this.deposit.metadata.publication.volume,
        ].join(' ')
      );
    }

    if (this.deposit.metadata.publication.number) {
      journal.push(
        [
          this._translateService.instant('no.'),
          this.deposit.metadata.publication.number,
        ].join(' ')
      );
    }

    if (this.deposit.metadata.publication.pages) {
      journal.push(
        [
          this._translateService.instant('p.'),
          this.deposit.metadata.publication.pages,
        ].join(' ')
      );
    }

    return journal.join(', ');
  }

  /**
   * Return formatted text for dissertation.
   *
   * @returns Text for dissertation.
   */
  get dissertation(): string {
    if (!this.deposit.metadata.dissertation) {
      return null;
    }

    const dissertation = [this.deposit.metadata.dissertation.degree];

    if (
      this.deposit.metadata.dissertation.grantingInstitution ||
      this.deposit.metadata.dissertation.date
    ) {
      dissertation.push(': ');

      if (this.deposit.metadata.dissertation.grantingInstitution) {
        dissertation.push(
          this.deposit.metadata.dissertation.grantingInstitution
        );
      }

      if (this.deposit.metadata.dissertation.date) {
        const date =
          this.deposit.metadata.dissertation.date.length === 4
            ? this.deposit.metadata.dissertation.date
            : this._datePipe.transform(
                this.deposit.metadata.dissertation.date,
                'dd.MM.yyyy'
              );
        dissertation.push(`, ${date}`);
      }
    }

    if (this.deposit.metadata.dissertation.jury_note) {
      dissertation.push(
        ` (${this._translateService.instant('Jury note').toLowerCase()}: ${
          this.deposit.metadata.dissertation.jury_note
        })`
      );
    }

    return dissertation.join('');
  }

  /**
   * Return next step key
   */
  get nextStep() {
    const currentIndex = this.steps.findIndex(
      (element) => element === this.currentStep
    );
    if (!this.steps[currentIndex + 1]) {
      return this.steps[currentIndex];
    }
    return this.steps[currentIndex + 1];
  }

  /**
   * Check if a result exists for a swisscovery search.
   *
   * @returns True if a search is done and a result is found.
   */
  get hasSwisscoveryResult(): boolean {
    return this.scResult && Object.keys(this.scResult).length > 0;
  }

  /**
   * Save current state on database with API call.
   */
  save() {
    this.form.updateValueAndValidity();

    if (this.form.valid === false) {
      this._toastrService.error(
        this._translateService.instant('The form contains errors')
      );
      return;
    }

    this._upgradeStep();
    this.deposit[this.currentStep] = this.model[this.currentStep];

    this._depositService
      .update(this.deposit.pid, this.deposit)
      .subscribe((result: any) => {
        if (result) {
          this._toastrService.success(
            this._translateService.instant('Deposit saved')
          );

          if (this.currentStep !== this.steps[this.steps.length - 1]) {
            this._router.navigate(['deposit', this.deposit.pid, this.nextStep]);
          }
        }
      });
  }

  /**
   * Return if the form is ready to publish or not.
   */
  canSubmit(): boolean {
    return (
      (this.deposit.status === 'in_progress' ||
        this.deposit.status === 'ask_for_changes') &&
      this.currentStep === 'diffusion' &&
      this.deposit.diffusion && this.deposit.diffusion.license
    );
  }

  /**
   * Removes a deposit (after confirmation) and go back to upload homepage.
   */
  cancelDeposit() {
    this._depositService
      .deleteDepositWithConfirmation(this.deposit)
      .subscribe((result: any) => {
        if (result === true) {
          this.deposit = null;
          this._router.navigate(['deposit', '0', 'create']);
        }
      });
  }

  /**
   * Publish a deposit after user confirmation. If user is a standard user, this will send an email
   * to moderators to validate the deposit.
   */
  publish() {
    this._dialogService
      .show({
        ignoreBackdropClick: true,
        initialState: {
          title: this._translateService.instant('Confirmation'),
          body: this._translateService.instant(
            'Do you really want to publish this document ?'
          ),
          confirmButton: true,
          confirmTitleButton: this._translateService.instant('OK'),
          cancelTitleButton: this._translateService.instant('Cancel'),
        },
      })
      .pipe(
        first(),
        switchMap((confirm: boolean) => {
          if (confirm === true) {
            this._spinner.show();
            return this._depositService.publish(this.deposit.pid);
          }

          return EMPTY;
        }),
        delay(1000)
      )
      .subscribe(() => {
        this._spinner.hide();
        this._router.navigate(['deposit', this.deposit.pid, 'confirmation']);
      });
  }

  /**
   * Extract metadata from PDF and populate deposit.
   */
  extractPdfMetadata() {
    this._dialogService
      .show({
        ignoreBackdropClick: true,
        initialState: {
          title: this._translateService.instant('Confirmation'),
          body: this._translateService.instant(
            'Do you really want to extract metadata from PDF and overwrite current data ?'
          ),
          confirmButton: true,
          confirmTitleButton: this._translateService.instant('OK'),
          cancelTitleButton: this._translateService.instant('Cancel'),
        },
      })
      .pipe(
        first(),
        switchMap((result: boolean) => {
          if (result === false) {
            return of(false);
          }

          this._spinner.show();

          return this._depositService.extractPDFMetadata(this.deposit);
        }),
        switchMap((result: any) => {
          if (result === false) {
            return of(false);
          }

          if (!this.deposit.metadata) {
            this.deposit.metadata = {};
          }

          const currentTitle =
            this.deposit.metadata.title ||
            this._translateService.instant('Deposit #ID', {
              id: this.deposit.pid,
            });

          if (result.title) {
            this.deposit.metadata.title = result.title;
          } else {
            this.deposit.metadata.title = currentTitle;
          }

          if (result.languages) {
            this.deposit.metadata.language = result.languages[0];
          }

          if (result.documentDate) {
            this.deposit.metadata.documentDate = result.documentDate;
          }

          if (result.publication) {
            this.deposit.metadata.publication = result.publication;
          }

          if (result.abstract) {
            this.deposit.metadata.abstracts = [
              {
                language: result.languages[0] || 'eng',
                abstract: result.abstract,
              },
            ];
          }

          if (result.authors) {
            this.deposit.contributors = result.authors;
          }

          return this._depositService.getJsonSchema('deposits');
        })
      )
      .subscribe((result: any) => {
        this._spinner.hide();

        if (result !== false) {
          this._createForm(result);
          this._toastrService.success(
            this._translateService.instant('Data imported successfully')
          );
        }
      });
  }

  /**
   * Search record in swisscovery
   *
   * @returns void
   */
  searchSwisscovery(): void {
    if (!this.scQuery.nativeElement.value) {
      return;
    }

    this._spinner.show();

    const params = new HttpParams()
      .set('type', this.scType.nativeElement.value)
      .set('query', this.scQuery.nativeElement.value)
      .set('format', 'deposit');

    this._httpClient
      .get(`${this._apiService.getEndpointByType('swisscovery', true)}/`, {
        params,
        observe: 'response',
      })
      .subscribe((response: HttpResponse<any>) => {
        this.scResult = response.status === 200 ? response.body : null;
        this._spinner.hide();
      });
  }

  /**
   * Map the swisscovery record to the deposit data.
   *
   * @returns void
   */
  mapSwisscoverRecord(): void {
    if (this.hasSwisscoveryResult === false) {
      return;
    }

    // Map data.
    this.deposit.metadata = this.scResult.metadata;
    if (this.scResult.contributors) {
      this.deposit.contributors = this.scResult.contributors;
    }

    // Refresh the form.
    this._depositService.getJsonSchema('deposits').subscribe((result) => {
      this._createForm(result);
      this.scResult = null;
    });
  }

  /**
   * Create form by extracting section corresponding to current step from JSON schema.
   * @param schema JSON schema
   */
  private _createForm(schema: any) {
    schema = processJsonSchema(resolve$ref(schema, schema.properties));
        // form configuration
    const editorConfig = {
      pid: this.deposit.pid,
      longMode: false,
      recordType: 'deposits'
    }
    const depositFields = this._formlyJsonschema.toFieldConfig(schema, {
      map: (field: any, fieldSchema: any) => {
        field = this._jsonschemaService.processField(field, fieldSchema);

        field.props.editorConfig = editorConfig;
        field.props.getRoot = (() => this.fields[0]);

        // Force validate `value` field when type is changed.
        if (fieldSchema.key && fieldSchema.key === 'identified_by_type') {
          field.props.change = (field: any) => {
            if (field.parent.model.value) {
              field.parent.formControl.controls.value.touched = true;
              field.parent.formControl.controls.value.updateValueAndValidity();
            }
          };
        }

        // Add a validator depending on field `type`
        if (fieldSchema.key && fieldSchema.key === 'identified_by_value') {
          field.validators = {
            identifier: {
              expression: (c: any) => {
                switch (c.parent.controls.type.value) {
                  case 'bf:Doi': {
                    return /^10\..+\/.+$/.test(c.value);
                  }
                  case 'bf:Isbn': {
                    return /^(97(8|9))?\d{9}(\d|X)$/.test(c.value);
                  }
                  case 'pmid': {
                    return /^[1-3]\d{7}|[1-9]\d{0,6}$/.test(c.value);
                  }
                  case 'uri': {
                    return /^https?:\/\/.+\..+$/.test(c.value);
                  }
                }

                return true;
              },
              message: (error: any, field: FormlyFieldConfig) =>
                this._translateService.instant(
                  'The format is not valid for this type of identifier.'
                ),
            },
          };
        }

        return field;
      },
    });

    this.model = {};
    this.form = new UntypedFormGroup({});

    if (this.deposit[this.currentStep]) {
      this.model[this.currentStep] = this.deposit[this.currentStep] instanceof Array
      ? [...this.deposit[this.currentStep]]
      : {...this.deposit[this.currentStep]};
    }
    this.fields = this._getFormFields(
      depositFields.fieldGroup,
      this.currentStep
    );
  }

  /**
   * Get only fields corresponding to current step.
   * @param fieldGroup Array of fields extracted from JSON schema
   * @param step Current step
   */
  private _getFormFields(fieldGroup: Array<any>, step: string): Array<any> {
    const fields = fieldGroup.filter((item) => item.key === step);
    return [fields[0]];
  }

  /**
   * Upgrade step of the deposit only if current step is greater than deposit step.
   */
  private _upgradeStep() {
    const depositIndex = this.steps.findIndex(
      (step) => step === this.deposit.step
    );
    const nextIndex = this.steps.findIndex((step) => step === this.nextStep);

    if (depositIndex < nextIndex) {
      this.deposit.step = this.nextStep;
    }
  }
}
