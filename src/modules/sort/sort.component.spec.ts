import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import {
  expect
} from '@blackbaud/skyux-builder/runtime/testing/browser';

import { SkyMediaBreakpoints, SkyMediaQueryService } from '../media-queries';
import { MockSkyMediaQueryService } from '../testing/mocks';

import { SkySortModule } from './sort.module';

import { SortTestComponent } from './fixtures/sort.component.fixture';

describe('Sort component', () => {
  let fixture: ComponentFixture<SortTestComponent>;
  let nativeElement: HTMLElement;
  let component: SortTestComponent;
  let mockMediaQueryService: MockSkyMediaQueryService;

  beforeEach(() => {
    mockMediaQueryService = new MockSkyMediaQueryService();

    TestBed.configureTestingModule({
      declarations: [
        SortTestComponent
      ],
      imports: [
        SkySortModule
      ],
      providers: [{provide: SkyMediaQueryService, useValue: mockMediaQueryService}]
    });

    fixture = TestBed.createComponent(SortTestComponent);
    nativeElement = fixture.nativeElement as HTMLElement;
    component = fixture.componentInstance;
  });

  function getDropdownButtonEl() {
    let dropdownButtonQuery = '.sky-sort .sky-dropdown .sky-dropdown-button';
    return nativeElement.querySelector(dropdownButtonQuery) as HTMLElement;
  }

  function getSortItems() {
    let itemQuery = '.sky-sort .sky-dropdown-menu .sky-sort-item';
    return nativeElement.querySelectorAll(itemQuery);
  }

  function triggerXsBreakpoint() {
    mockMediaQueryService.fire(SkyMediaBreakpoints.xs);
    fixture.detectChanges();
    return fixture.whenStable();
  }

  function triggerSmBreakpoint() {
    mockMediaQueryService.fire(SkyMediaBreakpoints.sm);
    fixture.detectChanges();
    return fixture.whenStable();
  }

  function verifyTextPresent() {
    expect(getDropdownButtonEl().innerText.trim()).toBe('Sort');
  }

  function verifyTextNotPresent() {
    expect(getDropdownButtonEl().innerText.trim()).not.toBe('Sort');
  }

  it('creates a sort dropdown that respects active input', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    let dropdownButtonEl = getDropdownButtonEl();
    expect(dropdownButtonEl).not.toBeNull();

    dropdownButtonEl.click();
    tick();
    fixture.detectChanges();
    tick();

    let menuHeaderQuery = '.sky-sort-menu-heading';
    expect(nativeElement.querySelector(menuHeaderQuery)).toHaveText('Sort by');

    let itemsEl = getSortItems();
    expect(itemsEl.length).toBe(6);
    expect(itemsEl.item(2)).toHaveCssClass('sky-sort-item-selected');
    expect(itemsEl.item(2)).toHaveText('Date created (newest first)');
  }));

  it('changes active item on click and emits proper event', fakeAsync(() => {
    fixture.detectChanges();
    let dropdownButtonEl = getDropdownButtonEl();
    dropdownButtonEl.click();
    tick();
    fixture.detectChanges();
    tick();

    let itemsEl = getSortItems();
    let clickItem = itemsEl.item(1).querySelector('button') as HTMLElement;

    clickItem.click();
    tick();
    fixture.detectChanges();
    tick();

    expect(component.sortedItem).toEqual({
      id: 2,
      label: 'Assigned to (Z - A)',
      name: 'assignee',
      descending: true
    });

    itemsEl = getSortItems();
    expect(itemsEl.item(1)).toHaveCssClass('sky-sort-item-selected');
  }));

  it('can set active input programmatically', () => {
    fixture.detectChanges();
    component.initialState = 4;
    fixture.detectChanges();
    let itemsEl = getSortItems();
    expect(itemsEl.item(3)).toHaveCssClass('sky-sort-item-selected');
  });

  describe('text and media queries', () => {

    it('text should not be present if not activated', () => {
      fixture.detectChanges();
      verifyTextNotPresent();
    });

    it('text should be present if activated when not an extra small screen', async(() => {
      component.showButtonText = true;
      fixture.detectChanges();
      verifyTextPresent();
      triggerSmBreakpoint().then(() => {
        fixture.detectChanges();
        verifyTextPresent();
      });
    }));

    it('text should not be present if activated when an extra small screen', async(() => {
      component.showButtonText = true;
      fixture.detectChanges();
      verifyTextPresent();
      triggerXsBreakpoint().then(() => {
        fixture.detectChanges();
        verifyTextNotPresent();
      });
    }));

  });
});
