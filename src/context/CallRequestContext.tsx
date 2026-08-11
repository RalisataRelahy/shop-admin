import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { supabase } from "../supabase/config";

type CallRequest = {
  id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  [key: string]: unknown;
};

type CallRequestContextValue = {
  callRequest: CallRequest | null;
  showCallRequest: (request: CallRequest) => void;
  openCallDialog: () => void;
  closeCallDialog: () => Promise<void>;
  openDialog: boolean;
};

const CallRequestContext = createContext<CallRequestContextValue | null>(null);

export function CallRequestProvider({ children }: { children: React.ReactNode }) {
  const [callRequest, setCallRequest] = useState<CallRequest | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const showCallRequest = useCallback((request: CallRequest) => {
    setCallRequest(request);
  }, []);

  const openCallDialog = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const closeCallDialog = useCallback(async () => {
    setOpenDialog(false);
    if (!callRequest?.id) return;

    await supabase
      .from("call_requests")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", callRequest.id);
    setCallRequest(null);
  }, [callRequest]);

  const value = useMemo(
    () => ({ callRequest, showCallRequest, openCallDialog, closeCallDialog, openDialog }),
    [callRequest, showCallRequest, openCallDialog, closeCallDialog, openDialog]
  );

  return <CallRequestContext.Provider value={value}>{children}</CallRequestContext.Provider>;
}

export function useCallRequestContext() {
  const context = useContext(CallRequestContext);
  if (!context) throw new Error("useCallRequestContext doit être utilisé dans CallRequestProvider");
  return context;
}
