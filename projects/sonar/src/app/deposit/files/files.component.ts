import { Component, ElementRef, ViewChild, input } from '@angular/core';

@Component({
  selector: 'sonar-deposit-files',
  templateUrl: './files.component.html',
  styleUrl: './files.component.css',
})
export class FilesComponent {
  mainFile = input.required<any>();
  depositPid = input.required<string>();
  additionalFiles = input<any>();
  /** File key to preview */
  previewFileKey: string;

}
