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
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RecordService } from '@rero/ng-core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationService } from 'primeng/api';
import { UserService } from '../../user.service';
import { validation_action, validation_status } from './constants';

/**
 * Component to manage validation on a record.
 */
@Component({
  selector: 'sonar-record-validation',
  templateUrl: './validation.component.html',
  styles: [],
  standalone: false,
})
export class ValidationComponent implements OnInit {
  // Constant for validation status.
  readonly validationStatus = validation_status;

  // Constant for validation actions.
  readonly validationAction = validation_action;

  // Record object.
  @Input()
  record: any;

  // Resource type.
  @Input()
  type: string;

  // Current logged user.
  user: any;

  // Validation metadata of the record.
  validation: any;

  // Wether to show logs table or not.
  showLogs = false;

  /** Used to retrieve value for the comment */
  @ViewChild('comment')
  comment: ElementRef;

  private _userService: UserService = inject(UserService);
  private _recordService: RecordService = inject(RecordService);
  private _translateService: TranslateService = inject(TranslateService);
  private _toastr: ToastrService = inject(ToastrService);
  private confirmationService: ConfirmationService =
    inject(ConfirmationService);
  private _spinner: NgxSpinnerService = inject(NgxSpinnerService);

  /**
   * Component initialization.
   *
   * Store validation metadata and current logged user.
   */
  ngOnInit(): void {
    this.validation = this.record.metadata.validation;

    this._userService.user$.subscribe((user) => {
      this.user = user;
    });
  }

  /**
   * Check if current user is the creator of the record.
   *
   * @returns True if current user is the creator of the record.
   */
  isOwner(): boolean {
    return this._userService.getUserRefEndpoint() === this.validation.user.$ref;
  }

  /**
   * Check if current user is moderator.
   *
   * @returns True if current user is moderator.
   */
  isModerator(): boolean {
    return this.user.is_moderator;
  }

  /**
   * Update the validation, depending on the action.
   *
   * @param action Action done.
   */
  updateValidation(action: string): void {
    this.confirmationService.confirm({
      header: this._translateService.instant('validation_action_' + action),
      message: this._translateService.instant(
        'Do you really want to do this action?'
      ),
      acceptIcon: 'none',
      rejectIcon: 'none',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this._spinner.show();

        this.validation.action = action;

        // Store the comment
        if (this.comment && this.comment.nativeElement.value) {
          this.validation.comment = this.comment.nativeElement.value;
        } else {
          delete this.validation.comment;
        }

        this._recordService
          .update(this.type, this.record.id, this.record)
          .subscribe((record: any) => {
            this.record = record;
            this.validation = this.record.metadata.validation;
            this._spinner.hide();
            this._toastr.success(
              this._translateService.instant(
                'Review has been done successfully!'
              )
            );
          });
      },
    });
  }
}
