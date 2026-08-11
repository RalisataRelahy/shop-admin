import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import alarmSound from '../assets/sounds/alarm.mp3';
import beepSound from '../assets/sounds/beep.mp3';
import SideBar from './components/SideBar';
import './MainLayout.css';
import { useCallRequestContext } from '../context/CallRequestContext';
import { supabase } from '../supabase/config';
import CallRequestDialog from '../components/CallRequestDialogue';

type NewOrder = {
  id: string;
  client_name?: string | null;
  client_phone?: string | null;
};

type CallRequest = Record<string, unknown> & { id: string };

export default function MainLayout() {
  const { showCallRequest, openCallDialog } = useCallRequestContext();
  const navigate = useNavigate();
  const [orderAlerts, setOrderAlerts] = useState<NewOrder[]>([]);
  const activeOrderAlert = orderAlerts[0];
  const knownCallRequestIds = useRef(new Set<string>());
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  const unlockAudio = useCallback(async () => {
    const alarm = alarmRef.current;
    if (!alarm || audioUnlockedRef.current) return;

    try {
      alarm.volume = 0;
      await alarm.play();
      alarm.pause();
      alarm.currentTime = 0;
      alarm.volume = 1;
      audioUnlockedRef.current = true;
    } catch {
      // Le navigateur n'autorise le son qu'après une interaction utilisateur.
    }
  }, []);

  const startAlarm = useCallback(async () => {
    const alarm = alarmRef.current;
    if (!alarm || !audioUnlockedRef.current) return;

    try {
      alarm.currentTime = 0;
      await alarm.play();
    } catch {
      // Une nouvelle interaction utilisateur permettra de réessayer.
    }
  }, []);

  const stopAlarm = useCallback(() => {
    const alarm = alarmRef.current;
    if (!alarm) return;
    alarm.pause();
    alarm.currentTime = 0;
  }, []);

  const playBeep = useCallback(async () => {
    const beep = beepRef.current;
    console.log('Bip called');
    if (!beep || !audioUnlockedRef.current) return;

    try {
      beep.currentTime = 0;
      await beep.play();
    } catch {
      // Une nouvelle interaction utilisateur permettra de réessayer.
    }
  }, []);

  useEffect(() => {
    const alarm = new Audio(alarmSound);
    alarm.loop = true;
    alarmRef.current = alarm;

    const beep = new Audio(beepSound);
    beep.loop = false;
    beepRef.current = beep;

    const enableAudio = () => void unlockAudio();
    window.addEventListener('pointerdown', enableAudio, { once: true });
    window.addEventListener('keydown', enableAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', enableAudio);
      window.removeEventListener('keydown', enableAudio);
      alarm.pause();
      beep.pause();
      alarmRef.current = null;
      beepRef.current = null;
    };
  }, [unlockAudio]);

  useEffect(() => {
    if (activeOrderAlert) void startAlarm();
  }, [activeOrderAlert, startAlarm]);

  const handleNewCallRequest = useCallback(
    (request: CallRequest) => {
      if (knownCallRequestIds.current.has(request.id)) return;
      knownCallRequestIds.current.add(request.id);
      showCallRequest(request);
      openCallDialog();
      void playBeep();
      toast.info('Nouvelle demande de rappel');
    },
    [openCallDialog, showCallRequest, playBeep]
  );

  const handleNewOrder = useCallback(
    (order: NewOrder) => {
      setOrderAlerts((current) => [...current, order]);
      toast.info(`Nouvelle commande${order.client_name ? ` de ${order.client_name}` : ''}`, {
        onClick: () => navigate('/commandes'),
      });
    },
    [navigate]
  );

  useEffect(() => {
    let isActive = true;

    const rememberExistingRequests = async () => {
      const { data } = await supabase.from('call_requests').select('id').eq('status', 'pending');
      if (!isActive) return;
      for (const request of data ?? []) knownCallRequestIds.current.add(request.id);
    };

    const checkNewCallRequests = async () => {
      const { data } = await supabase
        .from('call_requests')
        .select('id, customer_name, customer_phone, status, created_at')
        .eq('status', 'pending');
      if (!isActive) return;
      for (const request of data ?? []) handleNewCallRequest(request as CallRequest);
    };

    void rememberExistingRequests();

    const callRequestsChannel = supabase
      .channel('admin-call-requests-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_requests' },
        (payload) => handleNewCallRequest(payload.new as CallRequest)
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('admin-orders-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => handleNewOrder(payload.new as NewOrder)
      )
      .subscribe();

    const callRequestsPolling = window.setInterval(() => void checkNewCallRequests(), 15000);

    return () => {
      isActive = false;
      window.clearInterval(callRequestsPolling);
      void supabase.removeChannel(callRequestsChannel);
      void supabase.removeChannel(ordersChannel);
    };
  }, [handleNewCallRequest, handleNewOrder]);

  const dismissOrderAlert = useCallback(() => {
    stopAlarm();
    setOrderAlerts((current) => current.slice(1));
  }, [stopAlarm]);

  const goToOrder = useCallback(() => {
    dismissOrderAlert();
    navigate('/commandes');
  }, [dismissOrderAlert, navigate]);

  return (
    <div className="layout-container">
      <SideBar />
      <main className="main-content">
        <Outlet />
        <CallRequestDialog />
      </main>

      <ToastContainer position="bottom-right" autoClose={6000} newestOnTop closeOnClick pauseOnHover />

      <Dialog open={Boolean(activeOrderAlert)} onClose={dismissOrderAlert} maxWidth="xs" fullWidth>
        <DialogTitle>Nouvelle commande reçue</DialogTitle>
        <DialogContent>
          <Typography>
            {activeOrderAlert?.client_name
              ? `Commande de ${activeOrderAlert.client_name}.`
              : 'Une nouvelle commande vient d’être reçue.'}
          </Typography>
          {activeOrderAlert?.client_phone && (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {activeOrderAlert.client_phone}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={dismissOrderAlert}>Arrêter l’alarme</Button>
          <Button variant="contained" onClick={goToOrder}>Voir la commande</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
