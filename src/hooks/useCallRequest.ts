import { useEffect } from "react";
import { supabase } from "../supabase/config";

export function useCallRequests(onNewRequest: (request: any) => void) {
  useEffect(() => {
    const channel = supabase
      .channel("call_requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_requests",
        },
        (payload) => {
          onNewRequest(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewRequest]);
}