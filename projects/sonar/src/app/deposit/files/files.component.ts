import { Component, ElementRef, ViewChild, input } from '@angular/core';

@Component({
    selector: 'sonar-deposit-files',
    templateUrl: './files.component.html',
    standalone: false
})
export class FilesComponent {
  mainFile = input.required<any>();
  depositPid = input.required<string>();
  additionalFiles = input<any>();
  /** File key to preview */
  previewFileKey: string;
  isShowPreview = false;

}
