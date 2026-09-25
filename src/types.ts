export interface Venue {
  id: string;
  name: string;
  price: number;
  capacity: number;
  available: boolean;
  tagline?: string;
}

export type LogLevel = 'status' | 'decision' | 'disruption' | 'reason' | 'confirmed';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'grey' | 'green' | 'orange';
  tag: string;
  message: string;
  detail?: string;
}

export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'confirmed'
  | 'disrupted'
  | 'replanning'
  | 'adapted'
  | 'error';
