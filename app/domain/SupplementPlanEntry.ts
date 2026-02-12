import { Supplement } from './Supplement';

export interface SupplementPlanEntry {
  supplement: Supplement;
  startedAt: string;
  createdBy: string;
  editedAt?: string;
  editedBy?: string;
  planName: string;
  prefferedTime: string;
  notify: boolean;
  reason?: string;
}