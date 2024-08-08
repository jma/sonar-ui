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
import { Component, OnDestroy, OnInit, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyJsonschema } from '@ngx-formly/core/json-schema';
import { TranslateService } from '@ngx-translate/core';
import { JSONSchemaService, processJsonSchema, resolve$ref } from '@rero/ng-core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import { Subscription, combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { UserService } from '../../user.service';
import { DepositService } from '../deposit.service';

@Component({
  selector: 'sonar-deposit-editor',
  templateUrl: './editor.component.html',
})
export class EditorComponent implements OnInit, OnDestroy {
  /** Deposit object */
  deposit = input.required<any>();
  private deposit$ = toObservable(this.deposit);

  currentStep = input.required<string>();

  steps = input.required<any[]>();

  mainFile = input.required<any>();

  /** Current user */
  user: any = null;

  /** Form for current type */
  form: UntypedFormGroup = new UntypedFormGroup({});

  /** Model representing data for current type */
  model: any;

  /** Form fields for current type */
  fields: any;

  importModalIsVisible = false;

  importMenuItems = [];

  private subscriptions = new Subscription();

  // services
  private toastrService = inject(ToastrService);
  private depositService = inject(DepositService);
  private router = inject(Router);
  private formlyJsonschema = inject(FormlyJsonschema);
  private translateService = inject(TranslateService);
  private userUservice = inject(UserService);
  private spinner = inject(NgxSpinnerService);
  private jsonschemaService = inject(JSONSchemaService);
  private confirmationService = inject(ConfirmationService);


  ngOnInit(): void {

    this.subscriptions.add(this.deposit$.pipe(
        switchMap(() => {
          return combineLatest([
            this.userUservice.user$,
            this.depositService.getJsonSchema('deposits')
          ]);
        }),
        map((results) => {
          this.user = results[0];
          this._createForm(results[1]);
          this.setImportMenu();
        })
    ).subscribe());
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setImportMenu() {
    let items = [
      {
        label: this.translateService.instant('Import from swisscovery'),
          command: () => {
            this.importModalIsVisible = true;
          }
      }
    ];
    if (this.mainFile()) {
      items.push({
        label: this.translateService.instant('Analyze uploaded PDF'),
        command: () => {
          this.confirmPdfImport();
        }
      });
    }
    this.importMenuItems = items;
  }


  /** Return if current logged user is an admin or a standard user */
  get isAdminUser(): boolean {
    return this.userUservice.hasRole(['superuser', 'admin', 'moderator']);
  }

  /**
   * Return next step key
   */
  get nextStep() {
    const currentIndex = this.steps().findIndex(
      (element) => element === this.currentStep()
    );
    if (!this.steps()[currentIndex + 1]) {
      return this.steps()[currentIndex];
    }
    return this.steps()[currentIndex + 1];
  }



  /**
   * Save current state on database with API call.
   */
  save() {
    this.form.updateValueAndValidity();

    if (this.form.valid === false) {
      const fields = [];
      let control:any = this.form.controls['metadata'];
      Object.keys(control.controls).forEach((key: string) => {
        if (control.controls[key].status !== 'VALID') {
          fields.push(this.translateService.instant(key));
        }
      });
      let errorMessage = '';
      if (fields.length > 0) {
        errorMessage += '<br>' + this.translateService.instant('Field(s) in error: ');
        errorMessage += fields.join(', ');
      }
      this.toastrService.error(
        this.translateService.instant('The form contains errors.') + errorMessage,
        undefined,
        {enableHtml: true}
      );
      return;
    }

    this._upgradeStep();

    this.deposit()[this.currentStep()] = this.model[this.currentStep()];

    this.depositService
      .update(this.deposit().pid, this.deposit())
      .subscribe((result: any) => {
        if (result) {
          this.toastrService.success(
            this.translateService.instant('Deposit saved')
          );

          // navigate to the next step
          if (this.currentStep() !== this.steps()[this.steps().length - 1]) {
            this.router.navigate(['deposit', this.deposit().pid, this.nextStep]);
          }
        }
      });
  }

  /**
   * Return if the form is ready to publish or not.
   */
  canSubmit(): boolean {
    return (
      (this.deposit().status === 'in_progress' ||
        this.deposit().status === 'ask_for_changes') &&
      this.currentStep() === 'diffusion' &&
      this.deposit().diffusion && this.deposit().diffusion.license
    );
  }

  confirmPublish() {
    this.confirmationService.confirm({
      message: 'Do you really want to publish this document ?',
      header: this.translateService.instant('Confirmation'),
      acceptIcon:"none",
      rejectIcon:"none",
      rejectButtonStyleClass:"p-button-text",
      accept: () => {
        this.publish();
      }
  });
  }
  /**
   * Publish a deposit after user confirmation. If user is a standard user, this will send an email
   * to moderators to validate the deposit.
   */
  publish() {
    this.spinner.show();
    this.depositService.publish(this.deposit().pid).subscribe(() => {
        this.spinner.hide();
        this.router.navigate(['deposit', this.deposit().pid, 'confirmation']);
      });
  }

  confirmPdfImport() {
    this.confirmationService.confirm({
      message: this.translateService.instant(
        'Do you really want to extract metadata from PDF and overwrite current data ?'
      ),
      header: this.translateService.instant('Confirmation'),
      acceptIcon:"none",
      rejectIcon:"none",
      rejectButtonStyleClass:"p-button-text",
      accept: () => {
        this.extractPdfMetadata();
      }
  });
  }
  /**
   * Extract metadata from PDF and populate deposit.
   */
  extractPdfMetadata() {
    this.spinner.show();
    this.depositService.extractPDFMetadata(this.deposit()).pipe(
        tap((result: any) => {
          if (result === false) {
            return;
          }
          let metadata: any = {};
          ['title', 'documentDate', 'publication', 'abstracts', 'language'].map(field => {
            if(result[field]) {
              metadata[field] = result[field];
              if (field === 'abstract') {
                metadata.abstracts = [
                  {
                    language: result?.languages[0] || 'eng',
                    abstract: result.abstract,
                  },
                ]
              }
              else if (field === 'languages') {
                metadata.language = result.languages[0];
              }
              else result[field];
            }
          });
          if (metadata) {
            this.updateModel(metadata, 'metadata');
          }
          if(result.authors) {
            this.updateModel({contributors: result.authors}, 'contributors');
          }
        })
      ).subscribe({
        next: () => this.spinner.hide(),
        error: () => this.spinner.hide()
      });
  }


  /**
   * Map the swisscovery record to the deposit data.
   *
   * @returns void
   */
  mapSwisscoverRecord(data): void {
    this.importModalIsVisible = false;
    if (!data) {
      return;
    }
    this.updateModel(data['metadata'], 'metadata');
    this.updateModel(data['contributors'], 'contributors');
  }

  /**
   * Create form by extracting section corresponding to current step from JSON schema.
   * @param schema JSON schema
   */
  private _createForm(schema: any) {
    schema = processJsonSchema(resolve$ref(schema, schema.properties));
        // form configuration
    const editorConfig = {
      pid: this.deposit().pid,
      longMode: false,
      recordType: 'deposits'
    }
    const depositFields = this.formlyJsonschema.toFieldConfig(schema, {
      map: (field: any, fieldSchema: any) => {
        field = this.jsonschemaService.processField(field, fieldSchema);

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
                this.translateService.instant(
                  'The format is not valid for this type of identifier.'
                ),
            },
          };
        }

        return field;
      },
    });

    this.form = new UntypedFormGroup({});
    let currentStepData = this.deposit()[this.currentStep()];

    this.fields = this._getFormFields(
      depositFields.fieldGroup,
      this.currentStep()
    );
    this.model = {};
    this.updateModel(currentStepData);
  }

  updateModel(data, step=undefined) {
    if (!data) {
      return;
    }
    step = step? step: this.currentStep();
    let currentValue = this.model[step];
    if(currentValue) {
      this.model[step] = data instanceof Array ? [...currentValue, ...data] : {...currentValue, ...data};
    } else {
      this.model[step] = data;
    }
    this.model = {...this.model};
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
    const depositIndex = this.steps().findIndex(
      (step) => step === this.deposit().step
    );
    const nextIndex = this.steps().findIndex((step) => step === this.nextStep);

    if (depositIndex < nextIndex) {
      this.deposit().step = this.nextStep;
    }
  }
}
