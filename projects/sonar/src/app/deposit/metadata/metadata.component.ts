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
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { combineLatest } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { DepositService } from '../deposit.service';

@Component({
  selector: 'sonar-deposit-metadata',
  templateUrl: './metadata.component.html',
  styleUrl: './metadata.component.css'
})
export class MetadataComponent implements OnInit {

  /** Deposit object */
  deposit = signal<any>(null);

  /** Current form to show */
  currentStep = 'metadata';

  /** Deposit steps */
  steps: string[] = [
    'files',
    'metadata',
    'contributors',
    'projects',
    'diffusion',
  ];

  activeIndex = 0;

  /** Store files associated with deposit */
  private files = signal<any[]>([]);
  mainFile = computed(() => this.files().length > 0? this.files()[0]: null);
  /** Return additional files list */
  additionalFiles = computed(() => this.files().slice(1));
  maxStep = computed(() => this.deposit() ? this.deposit().step : 'metadata');


  /**
   * Constructor.
   *
   * @param _toastr Toastr service.
   * @param _depositService Deposit service
   * @param _router Router service
   * @param _route Route
   * @param _translateService Translate service.
   */
  constructor(
    private _toastrService: ToastrService,
    private _depositService: DepositService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    this._route.params
      .pipe(
        tap((params) => {
          this.currentStep = params.step;
        }),
        switchMap((params) => {
          return combineLatest([
            this._depositService.get(params.id),
            this._depositService.getFiles(params.id),
          ]);
        })
      )
      .subscribe({
        next: (result) => {
          this.activeIndex = 0;
          this.deposit.set(result[0].metadata);

          // TODO: solve this
          if (this._depositService.canAccessDeposit(this.deposit()) === false) {
            this._router.navigate([
              'deposit',
              this.deposit().pid,
              'confirmation',
            ]);
          }
          result[1].sort((a, b) => a.order - b.order);
          this.files.set(result[1]);
        },
        error: () => {
          this._toastrService.error(
            this._translateService.instant('Deposit not found')
          );
          this._router.navigate(['records', 'deposits']);
        }
      }
      );
  }

}
