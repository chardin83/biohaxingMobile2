import { SupplementPlanEntry } from './SupplementPlanEntry';

export interface Plan {
  name: string;
  prefferedTime: string;
  supplements: SupplementPlanEntry[];
  notify: boolean;
  reason?: string;
}
