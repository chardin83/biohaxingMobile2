import React, { createContext, useContext, useMemo, useState } from "react";

interface SessionContextType {
  forceOpenPopup: boolean;
  setForceOpenPopup: (val: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [forceOpenPopup, setForceOpenPopup] = useState(false);

  const value = useMemo(
    () => ({
      forceOpenPopup,
      setForceOpenPopup,
    }),
    [forceOpenPopup]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context)
    throw new Error("useSession måste användas inom en <SessionProvider>");
  return context;
};
