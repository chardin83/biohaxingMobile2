import {
  TargetDefinition,
  TargetProgress,
  TargetProgressStorage,
} from './targetProgressTypes';
import { TARGET_RESOLVERS } from './targetResolvers';

type GetTargetProgressParams = {
  target: TargetDefinition;
  selectedDate: string;
  storage: TargetProgressStorage;
};

export const getTargetProgress = ({
  target,
  selectedDate,
  storage,
}: GetTargetProgressParams): TargetProgress => {
  const resolver =
    TARGET_RESOLVERS[
      target.trackingKey
    ];

  const current = resolver
    ? resolver({
        target,
        selectedDate,
        storage,
      })
    : 0;

  return {
    current,
    target: target.amount,
    unit: target.unit,
    isFulfilled:
      current >= target.amount,
  };
};