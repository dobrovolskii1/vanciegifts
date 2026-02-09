
export interface SourceChannel {
  id: string;
  url: string;
  name?: string;
}

export enum BotStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

export interface AppState {
  myStyleChannel: string;
  sources: SourceChannel[];
  status: BotStatus;
}
