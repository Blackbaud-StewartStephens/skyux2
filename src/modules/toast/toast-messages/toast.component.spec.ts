import {
  ComponentFactoryResolver,
  Injector
} from '@angular/core';
import {
  TestBed
} from '@angular/core/testing';

import {
  SkyToastInstance
} from '../types';
import {
  SkyToastComponent
} from '.';

describe('Toast service', () => {
  class TestComponent { constructor(public message: SkyToastInstance) {} }
  let message: SkyToastInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Injector,
        {
          provide: ComponentFactoryResolver,
          useValue: {
            resolveComponentFactory() {
              return {
                create() {
                  return {
                    destroy() {},
                    hostView: {
                      rootNodes: [
                        {}
                      ]
                    },
                    instance: {
                      messageStream: {
                        take() {
                          return {
                            subscribe() { }
                          };
                        },
                        next() {}
                      },
                      attach() {
                        return {
                          close() { },
                          closed: {
                            take() {
                              return {
                                subscribe() { }
                              };
                            }
                          }
                        };
                      }
                    }
                  };
                }
              };
            }
          }
        }
      ]
    });
  });

  it('should instantiate a toast without a custom component',
    () => {
      message = new SkyToastInstance('My message', undefined, 'danger', [], () => {});
      let toast: SkyToastComponent;
      try {
        toast = new SkyToastComponent(undefined, undefined);
        toast.message = message;

        toast.ngOnInit();
        expect((toast as any).customComponent).toBeFalsy();

        toast.ngOnDestroy();
        expect((toast as any).customComponent).toBeFalsy();
      } catch (error) {
        fail();
      }
      expect(toast).toBeTruthy();
  });

  it('should show proper closed or open states', () => {
    message = new SkyToastInstance('My message', undefined, 'danger', [], () => {});
    let toast: SkyToastComponent = new SkyToastComponent(undefined, undefined);
    toast.message = message;

    toast.ngOnInit();

    expect(toast.getAnimationState()).toBe('toastOpen');
    message.close();
    toast.animationDone(undefined);
    expect(toast.getAnimationState()).toBe('toastClosed');
    expect(toast).toBeTruthy();
  });

  it('should instantiate a toast with a custom component and tear it down',
    () => {
      let clearCalled: boolean = false;
      let createComponentCalled: boolean = false;
      let destroyCalled: boolean = false;

      message = new SkyToastInstance(undefined, TestComponent, 'danger', [], () => {});

      let toast: SkyToastComponent;
      toast = new SkyToastComponent(TestBed.get(ComponentFactoryResolver), TestBed.get(Injector));
      toast.message = message;

      (toast as any).customToastHost = {
        clear: () => { clearCalled = true; },
        createComponent: () => {
          createComponentCalled = true;
          return {
            instance: {},
            destroy: () => { destroyCalled = true; }
          };
        }
      };

      toast.ngOnInit();
      expect((toast as any).customComponent).toBeTruthy();
      expect(clearCalled).toBeTruthy();
      expect(createComponentCalled).toBeTruthy();

      toast.ngOnDestroy();
      expect(destroyCalled).toBeTruthy();
      expect(toast).toBeTruthy();
  });
});