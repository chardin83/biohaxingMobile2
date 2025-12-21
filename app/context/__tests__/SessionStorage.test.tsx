import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { SessionProvider, useSession } from '../SessionStorage';

describe('SessionStorage', () => {
  it('provides default value and allows updating forceOpenPopup', () => {
    const contextRef = React.createRef<ReturnType<typeof useSession>>();
    const TestComponent = () => {
      const ctx = useSession();
      React.useEffect(() => {
        // @ts-ignore
        contextRef.current = ctx;
      });
      return null;
    };
    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>
    );
    expect(contextRef.current?.forceOpenPopup).toBe(false);
    act(() => {
      contextRef.current?.setForceOpenPopup(true);
    });
    // Wait for the state update to propagate
    return waitFor(() => {
      expect(contextRef.current?.forceOpenPopup).toBe(true);
    });
  });

  it('throws error if useSession is used outside provider', () => {
    // Suppress error output for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => useSession()).toThrow();
    spy.mockRestore();
  });
});
