import { AudioModule, RecordingPresets } from 'expo-audio';
import type { AudioRecorder } from 'expo-audio';
import * as FileSystem from 'expo-file-system';

export interface ActiveVoiceRecording {
  stop: () => Promise<{ uri: string; audioBase64: string }>;
}

export async function startVoiceRecording(): Promise<ActiveVoiceRecording> {
  const status = await AudioModule.requestRecordingPermissionsAsync();
  if (!status.granted) throw new Error('Microphone permission is required');
  // AudioRecorder is exported as a type from expo-audio; access the constructor via AudioModule
  const AudioRecorderClass = (AudioModule as any).AudioRecorder;
  const recorder: AudioRecorder = new AudioRecorderClass(RecordingPresets.HIGH_QUALITY);
  recorder.prepareToRecordAsync();
  recorder.record();
  return {
    stop: async () => {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('Recording URI missing');
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return { uri, audioBase64 };
    },
  };
}

export async function recordVoiceOnce(maxDurationMs = 30000) {
  const recording = await startVoiceRecording();
  await new Promise((resolve) => setTimeout(resolve, maxDurationMs));
  return recording.stop();
}
