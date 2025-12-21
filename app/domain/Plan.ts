import { Supplement } from "./Supplement";

export interface Plan {
  name: string;
  prefferedTime: string;
  supplements: Supplement[];
  notify: boolean;
}
