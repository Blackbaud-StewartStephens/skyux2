import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import {
  SkyAutocompleteSelectionChange,
  SkyAutocompleteInputDirective
} from '../autocomplete';

import {
  SkyToken,
  SkyTokensMessage,
  SkyTokensMessageType
} from '../tokens';

import {
  SkyWindowRefService
} from '../window';

import {
  SkyLookupChanges
} from './types';

import { SkyLookupAutocompleteAdapter } from './lookup-autocomplete-adapter';

@Component({
  selector: 'sky-lookup',
  templateUrl: './lookup.component.html',
  styleUrls: ['./lookup.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    /* tslint:disable-next-line:no-forward-ref */
    useExisting: forwardRef(() => SkyLookupComponent),
    multi: true
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkyLookupComponent
  extends SkyLookupAutocompleteAdapter
  implements AfterContentInit, OnDestroy, ControlValueAccessor {

  @Input()
  public ariaLabel: string;

  @Input()
  public ariaLabelledBy: string;

  @Input()
  public disabled = false;

  @Input()
  public placeholderText: string;

  @Output()
  public selectionChanges = new EventEmitter<SkyLookupChanges>();

  public get value(): any[] {
    if (!this.tokens) {
      return [];
    }

    return this.tokens.map(token => token.value);
  }

  public isInputFocused = false;
  public tokens: SkyToken[];
  public tokensController = new ReplaySubject<SkyTokensMessage>();

  @ViewChild(SkyAutocompleteInputDirective)
  private autocompleteInputDirective: SkyAutocompleteInputDirective;

  @ViewChild('lookupInput')
  private lookupInput: ElementRef;

  private destroyed = new ReplaySubject<boolean>();
  private idled = new ReplaySubject<boolean>();
  private markForTokenFocusOnKeyUp = false;

  constructor(
    private changeDetector: ChangeDetectorRef,
    private elementRef: ElementRef,
    private windowRef: SkyWindowRefService
  ) {
    super();
  }

  public ngAfterContentInit() {
    if (!this.disabled) {
      this.addEventListeners();
    }
  }

  public ngOnDestroy() {
    this.removeEventListeners();
    this.destroyed.next(true);
    this.destroyed.unsubscribe();
  }

  public onAutocompleteSelectionChange(change: SkyAutocompleteSelectionChange) {
    this.addToSelected(change.selectedItem);
    this.focusInput();
  }

  public onTokensChange(change: SkyToken[]) {
    if (change.length === 0) {
      this.focusInput();
    }

    if (this.tokens !== change) {
      this.tokens = change;
      this.onChange(this.value);
    }
  }

  public onTokensFocusIndexOverRange() {
    this.windowRef.getWindow().setTimeout(() => {
      this.focusInput();
    });
  }

  public writeValue(value: any[]) {
    if (value && !this.disabled) {
      const copy = this.cloneItems(value);
      this.tokens = this.parseTokens(copy);
      this.onChange(this.value);
      this.onTouched();
    }
  }

  // Angular automatically constructs these methods.
  /* istanbul ignore next */
  public onChange = (value: any[]) => {};
  /* istanbul ignore next */
  public onTouched = () => {};

  public registerOnChange(fn: (value: any) => void) {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  private addToSelected(item: any) {
    const tokenValues: any[] = this.tokens.map(token => token.value);
    const newValue = this.cloneItems(tokenValues.concat(item));
    this.writeValue(newValue);
    this.notifySelectionChange(this.value);
    this.clearSearchText();
  }

  private addEventListeners() {
    const inputElement = this.lookupInput.nativeElement;
    const hostElement = this.elementRef.nativeElement;
    const documentObj = this.windowRef.getWindow().document;

    let isSomethingFocused = false;

    Observable
      .fromEvent(inputElement, 'keydown')
      .takeUntil(this.idled)
      .subscribe((event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        if (key === 'arrowleft' || key === 'backspace') {
          if (this.isSearchEmpty()) {
            this.markForTokenFocusOnKeyUp = true;
          } else {
            this.markForTokenFocusOnKeyUp = false;
          }
        }
      });

    Observable
      .fromEvent(inputElement, 'keyup')
      .takeUntil(this.idled)
      .subscribe((event: KeyboardEvent) => {
        const key = event.key.toLowerCase();
        /* tslint:disable-next-line:switch-default */
        switch (key) {
          case 'arrowleft':
          case 'backspace':
          if (this.markForTokenFocusOnKeyUp) {
            this.tokensController.next({
              type: SkyTokensMessageType.FocusLastToken
            });
          }
          break;

          case 'escape':
          event.preventDefault();
          this.clearSearchText();
          break;
        }
      });

    Observable
      .fromEvent(documentObj, 'mousedown')
      .takeUntil(this.idled)
      .subscribe((event: MouseEvent) => {
        const hostClicked = (hostElement.contains(event.target));

        isSomethingFocused = false;

        if (hostClicked) {
          this.isInputFocused = true;
        } else {
          this.isInputFocused = false;
          isSomethingFocused = true;
        }

        this.changeDetector.markForCheck();
      });

    Observable
      .fromEvent(documentObj, 'mouseup')
      .takeUntil(this.idled)
      .subscribe(() => {
        if (!isSomethingFocused) {
          this.focusInput();
        }
      });

    Observable
      .fromEvent(documentObj, 'focusin')
      .takeUntil(this.idled)
      .subscribe((event: KeyboardEvent) => {
        if (hostElement.contains(event.target)) {
          isSomethingFocused = true;
          this.isInputFocused = true;
        } else {
          this.isInputFocused = false;
        }

        this.changeDetector.markForCheck();
      });
  }

  private removeEventListeners() {
    this.idled.next(true);
    this.idled.unsubscribe();
    this.idled = new ReplaySubject<boolean>();
  }

  private focusInput() {
    this.lookupInput.nativeElement.focus();
  }

  private clearSearchText() {
    this.autocompleteInputDirective.value = undefined;
  }

  private isSearchEmpty() {
    return (!this.lookupInput.nativeElement.value);
  }

  private notifySelectionChange(items: any[]) {
    this.selectionChanges.emit({
      selectedItems: items
    });
  }

  private cloneItems(items: any[]): any[] {
    return items.map(item => {
      return { ...item };
    });
  }

  private parseTokens(data: any[]): SkyToken[] {
    return data.map((item: any) => {
      return {
        value: item
      };
    });
  }
}