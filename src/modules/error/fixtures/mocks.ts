import { SkyModalService } from '../../modal/modal.service';
import { SkyModalInstance } from '../../modal/modal-instance';

export class SkyModalInstanceMock {
  public close() {}
}

export class MockHostService {
  public getModalZIndex(): number {
    return 1;
  }
}

export interface OpenParameters {
  component: any;
  providers?: any[];
}

export class MockModalService extends SkyModalService {
  public openCalls: OpenParameters[] = [];

  public open(component: any, providers?: any[]): SkyModalInstance {
    this.openCalls.push({component: component, providers: providers});

    return undefined;
  }
}
