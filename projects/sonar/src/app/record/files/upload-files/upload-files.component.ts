/*
 * SONAR User Interface
 * Copyright (C) 2024 RERO
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

import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, effect, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { DialogService, RecordService } from '@rero/ng-core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { FileUpload } from 'primeng/fileupload';
import { OrderList } from 'primeng/orderlist';
import {
  Observable,
  catchError,
  combineLatest,
  concatMap,
  from,
  map,
  of,
  switchMap,
  tap,
  toArray,
} from 'rxjs';
import { AppConfigService } from '../../../app-config.service';

@Component({
  selector: 'sonar-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrl: './upload-files.component.scss',
})
export class UploadFilesComponent {
  // resource pid
  pid = input.required<string>();
  // record type such as documents
  recordType = input.required<string>();

  // initial record from pid and recordType
  initialRecord = toSignal(
    combineLatest(toObservable(this.pid), toObservable(this.recordType)).pipe(
      switchMap(([pid, recordType]) =>
        pid && recordType
          ? this.fileService
              .get(`/api/${recordType}/${pid}`)
              .pipe(map((rec: any) => (rec = rec.metadata)))
          : of(null)
      )
    )
  );
  // current record
  record: any = {};

  // initial files form record
  initialFiles = toSignal(
    toObservable(this.initialRecord).pipe(
      switchMap((record) => (record ? this.getFiles(record) : of([])))
    )
  );

  // current list of files
  files: any = [];

  // record JSONSchema for the editor
  fileSchema = toSignal(
    toObservable(this.recordType).pipe(
      switchMap((recordType) =>
        recordType
          ? this.recordService
              .getSchemaForm(recordType)
              .pipe(map((res) => res.schema.properties._files.items))
          : of([])
      )
    )
  );

  // the maximum number of files by file record
  maxFiles = 500;

  // the primeng file upload component
  @ViewChild('fileUpload')
  fileUpload: FileUpload;

  //------------- Services -------------
  // file service
  fileService = inject(HttpClient);
  // record service
  recordService = inject(RecordService);
  // translate service
  translateService = inject(TranslateService);
  // toaster service
  toastrService = inject(ToastrService);
  // dialog service
  dialogService = inject(DialogService);
  // spinner service
  spinner = inject(NgxSpinnerService);
  // number of uploaded files
  nUploadedFiles = 0;
  // application configuration service
  appConfigService = inject(AppConfigService);

  // maximum upload file size
  maxFileSize: number;

  // primeng order list for search query reset
  @ViewChild('orderList') orderList: OrderList;

  /**
   * constructor
   */
  constructor() {
    this.maxFileSize = this.appConfigService.maxFileSize;
    // update the current record and files when the inputs change
    effect(() => {
      this.record = this.initialRecord();
      this.files = this.initialFiles();
    });
  }

  /**
   * Update the file metadata.
   *
   * @param file the file object to update the label.
   * @param metadata the new metadata.
   */
  update(file, metadata) {
    // remove useless spaces
    metadata.label = metadata.label.trim();

    let indexToUpdate = this.record._files.findIndex(
      (item) => item.key === file.key
    );
    if (indexToUpdate >= 0) {
      this.fileService
        .put(`/api/documents/${this.pid()}`, this.record)
        .subscribe((record: any) => {
          // update the current record
          this.record = record.metadata;
          file.metadata = this._getFileInRecord(file.key);
          file.label = file.metadata.label;
          this.toastrService.success(
            this.translateService.instant(
              'Metadata have been saved successfully.'
            )
          );
        });
    }
  }

  // True if the maxiumum number of files is reached.
  get reachMaxFileLimit(): boolean {
    return this.files.length >= this.maxFiles;
  }

  /**
   * Upload a new file.
   *
   * @param event the standard event.
   * @param _ unused.
   */
  uploadHandler(event, _) {
    if (event.files.length > 0) {
      this.spinner.show('file-upload');
      let obs: Observable<any> = this.generateCreateRequests(event);
      obs
        .pipe(
          catchError((e: any) => {
            let msg = this.translateService.instant('Server error');
            if (e.error.message) {
              msg = `${msg}: ${e.error.message}`;
            }
            this.toastrService.error(msg);
            return of([]);
          }),
          tap(() => {
            this.getRecord();
            this.resetFilter();
            this.fileUpload.clear();
            this.toastrService.success(
              this.translateService.instant('File uploaded successfully.')
            );
            this.nUploadedFiles = 0;
          })
        )
        .subscribe(() => this.spinner.hide('file-upload'));
    }
  }

  /**
   * Upload a new version of a given file.
   * @param event - dict with the file and the fileUpload stream.
   */
  uploadNewVersion(event) {
    let file = event.file;
    let fileUpload: File = event.fileUpload;
    this.spinner.show('file-upload');
    this.fileService
      .put(`/api/documents/${this.pid()}/files/${file.key}`, fileUpload)
      .pipe(
        catchError((e: any) => {
          let msg = this.translateService.instant('Server error');
          if (e.error.message) {
            msg = `${msg}: ${e.error.message}`;
          }
          this.toastrService.error(msg);
          return of(null);
        }),
        map((file: any) => {
          // update the record and the files
          this.getRecord();
        }),
        tap(() => {
          this.resetFilter();
          this.toastrService.success(
            this.translateService.instant('File uploaded successfully.')
          );
        })
      )
      .subscribe(() => this.spinner.hide('file-upload'));
  }

  /**
   * Get the record and the files from the backend.
   */
  getRecord() {
    this.fileService
      .get(`/api/${this.recordType()}/${this.pid()}`)
      .pipe(
        map((rec: any) => (rec = rec.metadata)),
        tap((record) => (this.record = record)),
        switchMap((record) => this.getFiles(record)),
        tap((files) => (this.files = files))
      )
      .subscribe();
  }

  /**
   * Generate the sequential http requests.
   *
   * @param event the standard event.
   * @returns an observable of sequential http requests
   */
  private generateCreateRequests(event): Observable<any> {
    return from(event.files).pipe(
      concatMap((f: any) =>
        this.fileService.put(`/api/documents/${this.pid()}/files/${f.name}`, f)
      ),
      map((file: any) => {
        this.nUploadedFiles += 1;
        this.files = this.processFiles([
          { label: file.key, ...file },
          ...this.files,
        ]);
      }),
      // like a forkJoin
      toArray()
    );
  }

  /**
   * Filter the uploaded files.
   *
   * @param event the standard event.
   * @param _ unused.
   */
  onSelect(event, _) {
    const existingFileNames = [];
    for (let i = 0; i < event.files.length; i++) {
      const fileName = event.files[i].name;
      if (this.files.some((v) => v.key == fileName)) {
        existingFileNames.push(fileName);
      } else {
        event.files[i].label = fileName;
      }
    }
    if (existingFileNames.length > 0) {
      this.fileUpload.msgs.push({
        severity: 'error',
        summary: 'This filename already exists.',
        detail: `${existingFileNames.join(', ')}`,
      });
      this.fileUpload.files = this.fileUpload.files.filter(
        (v) => !existingFileNames.some((n) => n == v.name)
      );
    }
    const numberOfMaxUploadedFiles = this.maxFiles - this.files.length;
    if (numberOfMaxUploadedFiles < this.fileUpload.files.length) {
      this.fileUpload.files = this.fileUpload.files.slice(
        0,
        numberOfMaxUploadedFiles
      );
    }
  }

  /**
   * Removes a given file.
   *
   * @param file - the file to delete.
   */
  deleteFile(file: any) {
    // dialog confirmation
    this.dialogService
      .show({
        ignoreBackdropClick: true,
        initialState: {
          title: this.translateService.instant('Confirmation'),
          body: this.translateService.instant(
            'Do you really want to remove this file and all versions?'
          ),
          confirmButton: true,
          confirmTitleButton: this.translateService.instant('OK'),
          cancelTitleButton: this.translateService.instant('Cancel'),
        },
      })
      .pipe(
        switchMap((confirm: boolean) => {
          if (confirm === true) {
            // remove the file
            return this.fileService
              .delete(`/api/documents/${this.pid()}/files/${file.key}`)
              .pipe(
                map((res) => {
                  this.files = this.files.filter((f) => f.key !== file.key);
                  this.resetFilter();
                  this.toastrService.success(
                    this.translateService.instant('File removed successfully.')
                  );
                  return true;
                })
              );
          }
          return of(false);
        })
      )
      .subscribe();
  }

  /**
   * Reset the query to filter the file list.
   */
  resetFilter() {
    this.orderList.resetFilter();
  }

  /**
   * Observable for loading record and files.
   *
   * @returns Observable emitting files
   */
  private getFiles(record): Observable<any> {
    return this.fileService
      .get(`/api/documents/${record.pid}/files?versions`)
      .pipe(
        map((record: any) => {
          if (record?.contents) {
            return record.contents;
          }
          return of([]);
        }),
        map((files) => {
          return files.map((item: any) => {
            item.metadata = this._getFileInRecord(item.key);
            if (item?.label == null) {
              item.label = item?.metadata?.label
                ? item.metadata.label
                : item.key;
            }
            return item;
          });
        }),
        map((files) => {
          return this.processFiles(files);
        }),
        catchError(() => {
          return of([]);
        })
      );
  }

  /**
   * Process the list of files from the backend.
   * @param files the files to process
   * @returns the processed files
   */
  private processFiles(files) {
    // get old versions
    let versions = {};
    files.map((file) => {
      if (file?.metadata?.type === 'file' && file.is_head === false) {
        if (!(file.key in versions)) versions[file.key] = [];
        versions[file.key].push(file);
      }
    });
    // get head files only
    let headFiles = [];
    files.map((file) => {
      if (file?.metadata?.type === 'file' && file.is_head) {
        // add versions if exists
        if (versions[file.key]) {
          let fileVersions = versions[file.key];
          fileVersions.sort((a, b) => a.metadata.created - b.metadata.created);
          file.versions = fileVersions;
        }
        headFiles.push(file);
      }
    });
    headFiles.sort((a, b) => a.metadata.order - b.metadata.order);
    return headFiles;
  }

  /**
   * Reorder the files.
   */
  reorder() {
    this.files.map((file, index) => {
      let recordFile = this._getFileInRecord(file.key);
      recordFile.order = index + 1;
    });
    this.fileService
      .put(`/api/documents/${this.pid()}`, this.record)
      .subscribe((record: any) => {
        this.record = record.metadata;
        this.files.map((file) => {
          file.metadata = this._getFileInRecord(file.key);
        });
      });
  }

  /**
   * Get files metadata corresponding to file key, stored in record.
   *
   * @param fileKey File key.
   * @returns Metadata object for the file.
   */
  private _getFileInRecord(fileKey: string): any {
    if (!this.record._files) {
      return null;
    }

    // Get metadata stored in record.
    const metadata = this.record._files.filter(
      (item: any) => fileKey === item.key
    );

    return metadata.length > 0 ? metadata[0] : null;
  }
}
