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
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'sonar-deposit-step',
    templateUrl: './step.component.html',
    // styleUrls: ['./step.component.scss'],
    standalone: false
})
export class StepComponent implements OnInit {
  /** Current step of the process */
  /** Current max step, no link available for next steps. */
  @Input()
  maxStep: string = null;
  private translateService: TranslateService = inject(TranslateService);

  /** Array of step for deposit process */
  @Input()
  steps: string[] = [];

  items: MenuItem[] = [];

  ngOnInit() {
    if (!this.maxStep) {
      this.maxStep = this.steps[0];
    }
    this.translateService.onLangChange.subscribe({
      next: () => this.setItems(),
    });
    this.setItems();
  }

  setItems() {
    let disabled = false;
    this.items = this.steps.map((item: string): MenuItem => {
      const data =  {label: this.translateService.instant(`step_${item}`), routerLink: ['..', item], disabled};
      if (this.maxStep === item) {
        disabled = true;
      }
      return data;
    })
  }
}
