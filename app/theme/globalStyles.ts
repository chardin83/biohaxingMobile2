import { StyleSheet } from 'react-native';

const BORDER_RADIUS = 22;
const BORDER_RADIUS_SMALL = 12;

export const globalStyles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  marginTop8: {
    marginTop: 8,
  },
  marginTop16: {
    marginTop: 16,
  },
  borders: {
    borderRadius: BORDER_RADIUS_SMALL,
  },
  topBorder: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
   colWithDivider: {
    borderRightWidth: 1,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },
  infoSection: {
    marginBottom: 16,
  },
   explainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  card: {
    padding: 15,
    borderRadius: BORDER_RADIUS,
    marginVertical: 8,
    borderWidth: 2,
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});