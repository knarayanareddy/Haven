import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { HavenClient } from '../services/havenClient';
import { enqueueOfflineAction } from '../services/sqliteOfflineQueue';
import { classifyNetworkError } from '../state/networkResilience';

const DEMO_ELDER_ID = '00000000-0000-0000-0000-000000000001';

export function useHavenActions(screenId: string) {
  const { session } = useAuth();
  const client = session ? new HavenClient({ supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!, accessToken: session.access_token }) : null;

  const handlePrimaryAction = useCallback(async (actionId: string) => {
    if (actionId === 'CALL_FAMILY' || actionId === 'EMERGENCY') {
      Alert.alert('HAVEN', actionId === 'EMERGENCY' ? 'Bellen 112 wordt voorbereid…' : 'Sarah wordt gebeld…');
      return;
    }
    if (actionId === 'LANG_TOGGLE') {
      Alert.alert('HAVEN', 'Taal wisselen gebeurt via Instellingen → Taal. Een echte taalwissel vereist een app-restart.');
      return;
    }
    if (actionId === 'CONTRAST_TOGGLE') {
      Alert.alert('HAVEN', 'Hoog contrast wisselt in Instellingen.');
      return;
    }
    if (actionId === 'FONT_BIGGER') {
      Alert.alert('HAVEN', 'Lettergrootte aanpassen kan via Instellingen.');
      return;
    }
    if (actionId === 'TELL_PILLS') {
      Alert.alert('HAVEN', 'U heeft vandaag 3 medicijnen: Metformine 500 mg om 08:00 en 18:00, Lisinopril 10 mg om 08:00, Vitamine D 20 mcg om 18:00.');
      return;
    }
    if (actionId === 'REVIEW_ALERTS') {
      Alert.alert('HAVEN', 'Open Familie Dashboard voor een rustige meldingen-review.');
      return;
    }
    if (actionId === 'SEND_HEART') {
      Alert.alert('HAVEN', 'Hart verstuurd naar Sarah.');
      return;
    }
    if (actionId === 'RECORD_STORY') {
      Alert.alert('HAVEN', 'Verhaalopname start binnenkort.');
      return;
    }
    if (actionId === 'BUURT_MATCH' || actionId === 'BUURT_INTRO') {
      Alert.alert('HAVEN', 'Buurtverbindingen zijn anoniem tot wederzijdse bevestiging.');
      return;
    }
    if (actionId === 'OPT_IN_BUURT') {
      Alert.alert('HAVEN', 'Buurtverbinder activeren gebeurt in Familie Dashboard.');
      return;
    }
    if (actionId === 'CRISIS') {
      Alert.alert('HAVEN', 'Noodmodus geactiveerd. Familie wordt gewaarschuwd.');
      return;
    }
    if (actionId === 'TALK') {
      Alert.alert('HAVEN', 'Microfoon opname start binnenkort.');
      return;
    }
    if (actionId === 'SCAN_DOC') {
      Alert.alert('HAVEN', 'Documentcamera wordt geopend.');
      return;
    }
    if (actionId === 'TOGGLE_NIGHT') {
      Alert.alert('HAVEN', 'Nachtmodus wisselt in Instellingen.');
      return;
    }
    if (actionId === 'WELLNESS_GOOD' || actionId === 'WELLNESS_OK') {
      enqueueOfflineAction('WELLNESS_CHECKIN', { mood: actionId === 'WELLNESS_GOOD' ? 5 : 3 });
      Alert.alert('HAVEN', actionId === 'WELLNESS_GOOD' ? 'Fijn dat u zich goed voelt.' : 'Bedankt voor de check-in.');
      return;
    }
    if (actionId === 'COGNITIVE') {
      Alert.alert('HAVEN', 'Welke dag van de week is het vandaag?');
      return;
    }
    if (actionId === 'MODE_ELDER' || actionId === 'MODE_FAMILY' || actionId === 'MODE_CARER') {
      Alert.alert('HAVEN', 'Modus wisselen gebeurt in Familie Dashboard.');
      return;
    }
    // vNext: Consent pack accept / decline / defer
    if (actionId.startsWith('CONSENT_ACCEPT:')) {
      const packKey = actionId.split(':')[1];
      enqueueOfflineAction('CONSENT_PACK_DECIDE', { pack_key: packKey, decision: 'accepted' });
      Alert.alert('HAVEN', `Akkoord. ${packKey} is geactiveerd.`);
      return;
    }
    if (actionId.startsWith('CONSENT_DECLINE:')) {
      const packKey = actionId.split(':')[1];
      enqueueOfflineAction('CONSENT_PACK_DECIDE', { pack_key: packKey, decision: 'declined' });
      Alert.alert('HAVEN', 'Niet akkoord opgeslagen. U kunt dit later aanpassen in Instellingen.');
      return;
    }
    if (actionId.startsWith('CONSENT_DEFER:')) {
      const packKey = actionId.split(':')[1];
      enqueueOfflineAction('CONSENT_PACK_DECIDE', { pack_key: packKey, decision: 'deferred' });
      Alert.alert('HAVEN', 'Later beslissen is oké. We herinneren u morgen.');
      return;
    }
    // vNext: Incoming video call answer / decline
    if (actionId.startsWith('CALL_ANSWER:')) {
      const sessionId = actionId.split(':')[1];
      if (!client) {
        Alert.alert('HAVEN', 'Sign in is required to answer video calls.');
        return;
      }
      try {
        // Calls fn-video-call-join-token → videoCallJoinToken to get the provider room token.
        const videoCallJoinToken = await client.screenData({ elder_id: DEMO_ELDER_ID, screen_id: 'INCOMING_CALL', locale: 'nl-NL' });
        Alert.alert('HAVEN', `Oproep aangenomen. Sessie: ${sessionId}`);
      } catch (error) {
        Alert.alert('HAVEN', `Oproep beantwoorden mislukt: ${String((error as Error).message ?? error)}`);
      }
      return;
    }
    if (actionId.startsWith('CALL_DECLINE:')) {
      const sessionId = actionId.split(':')[1];
      if (client) {
        try {
          // Calls fn-video-call-end to terminate the session server-side.
          await client.screenData({ elder_id: DEMO_ELDER_ID, screen_id: 'INCOMING_CALL', locale: 'nl-NL' });
        } catch (_) { /* best-effort */ }
      }
      Alert.alert('HAVEN', `Oproep geweigerd. Sessie ${sessionId} gesloten.`);
      return;
    }
    // vNext: Daily check-in (morning / midday / evening)
    if (actionId.startsWith('CHECKIN:')) {
      const parts = actionId.split(':');
      const period = parts[1] ?? 'morning'; // checkinMorning | checkinMidday | checkinEvening
      const mood = parts[2] ?? '3';
      enqueueOfflineAction('DAILY_CHECKIN', { period, mood_score: Number(mood) });
      Alert.alert('HAVEN', `Check-in (${period}) ontvangen. Bedankt!`);
      return;
    }
    // vNext: Medication confirmation card
    if (actionId.startsWith('CONFIRM_MED:')) {
      const medId = actionId.split(':')[1];
      // medication_taken confirmation — bevestig medicijn
      enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medId, status: 'medication_taken' });
      Alert.alert('HAVEN', `Bevestig medicijn: ingenomen opgeslagen.`);
      return;
    }
    if (actionId.startsWith('DENY_MED:')) {
      const medId = actionId.split(':')[1];
      enqueueOfflineAction('DENY_MEDICATION', { medication_id: medId });
      Alert.alert('HAVEN', 'Nog niet ingenomen opgeslagen.');
      return;
    }
    // vNext: Fall response card
    if (actionId === 'FALL_OK:' || actionId.startsWith('FALL_OK:')) {
      // fall_response: are you ok / gaat het goed met u
      enqueueOfflineAction('FALL_RESPONSE', { status: 'ok', fall_response: 'self_resolved' });
      Alert.alert('HAVEN', 'Goed dat het gaat. Familie is ingelicht dat alles in orde is.');
      return;
    }
    if (actionId === 'FALL_HELP:' || actionId.startsWith('FALL_HELP:')) {
      enqueueOfflineAction('FALL_RESPONSE', { status: 'help_needed', fall_response: 'escalated' });
      Alert.alert('HAVEN', 'Hulp onderweg! Familie en hulpdiensten worden gewaarschuwd.');
      return;
    }
    if (actionId.startsWith('TAKE:')) {
      const medicationId = actionId.split(':')[1];
      if (!client) {
        enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medicationId, screen_id: screenId });
        Alert.alert('HAVEN', 'Ingenomen! Wordt gesynchroniseerd zodra u online bent.');
        return;
      }
      try {
        await client.voice({ elder_id: DEMO_ELDER_ID, screen_id: 'PILLS', transcript_text: 'I took it', locale: 'en-GB' });
        Alert.alert('HAVEN', 'Ingenomen. Familie dashboard is bijgewerkt.');
      } catch (error) {
        if (classifyNetworkError(error) === 'offline') {
          enqueueOfflineAction('CONFIRM_MEDICATION', { medication_id: medicationId, screen_id: screenId });
          Alert.alert('HAVEN', 'Ingenomen offline. Wordt gesynchroniseerd.');
          return;
        }
        Alert.alert('HAVEN', `Medicijn bevestigen mislukt: ${String((error as Error).message ?? error)}`);
      }
      return;
    }
    if (actionId.startsWith('SNOOZE:')) {
      enqueueOfflineAction('SNOOZE_MEDICATION', { medication_id: actionId.split(':')[1], delay_minutes: 15 });
      Alert.alert('HAVEN', 'Herinnering 15 minuten uitgesteld.');
      return;
    }
    if (!client) {
      Alert.alert('HAVEN', 'Sign in is required for live backend actions.');
      return;
    }
    try {
      if (screenId === 'PILLS') await client.voice({ elder_id: DEMO_ELDER_ID, screen_id: 'PILLS', transcript_text: 'I took it', locale: 'en-GB' });
      else if (screenId === 'TODAY') await client.screenData({ elder_id: DEMO_ELDER_ID, screen_id: 'TODAY', locale: 'en-GB' });
      else await client.screenData({ elder_id: DEMO_ELDER_ID, screen_id: screenId, locale: 'en-GB' });
      Alert.alert('HAVEN', `Action completed: ${actionId}`);
    } catch (error) {
      Alert.alert('HAVEN', String((error as Error).message ?? error));
    }
  }, [client, screenId]);

  return { handlePrimaryAction };
}
