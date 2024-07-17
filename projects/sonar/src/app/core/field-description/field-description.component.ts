import { AfterContentInit, Component, ContentChildren, QueryList, TemplateRef, computed, input } from '@angular/core';
import { PrimeTemplate } from 'primeng/api';
import { Nullable } from 'primeng/ts-helpers';

@Component({
  selector: 'sonar-field-description',
  templateUrl: './field-description.component.html'
})
export class FieldDescriptionComponent implements AfterContentInit {
  label = input<string>();
  field = input<any>();
  type = computed(() => this.getType());
  template: Nullable<TemplateRef<any>>;

  @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | null;

  ngAfterContentInit() {
    (this.templates as QueryList<PrimeTemplate>).forEach((item) => {
        switch (item.getType()) {
            case 'template':
                this.template = item.template;
                break;
        }
      });
    }
    getType() {
      const field = this.field();
      if (Array.isArray(field)) {
        return 'array';
      }
      return typeof field;
    }
}
