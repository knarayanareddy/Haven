import { HavenClient } from '../services/havenClient';
import { completeOfflineAction, incrementOfflineRetry, listOfflineActions } from '../services/sqliteOfflineQueue';
import { resilientCall } from './networkResilience';

export type SyncState = 'idle' | 'syncing' | 'paused_offline' | 'failed';

export class OfflineSyncMachine {
  private state: SyncState = 'idle';
  get current() { return this.state; }

  async sync(client: HavenClient) {
    this.state = 'syncing';
    const actions = listOfflineActions();
    for (const action of actions) {
      try {
        await resilientCall(async () => {
          if (action.type === 'CONFIRM_MEDICATION') return client.voice({ ...(action.payload as any), transcript_text: 'I took it' });
          if (action.type === 'SEND_MESSAGE') return client.sendFamilyMessage(action.payload);
          if (action.type === 'WELLNESS_CHECKIN') return client.healthLog(action.payload);
          return client.screenData(action.payload);
        });
        completeOfflineAction(action.idempotencyKey);
      } catch (_) {
        incrementOfflineRetry(action.idempotencyKey);
        this.state = 'failed';
        return;
      }
    }
    this.state = 'idle';
  }

  pauseOffline() { this.state = 'paused_offline'; }
  reset() { this.state = 'idle'; }
}
