import speech from '@google-cloud/speech';

const client = new speech.SpeechClient();

const LANGUAGE_HINTS = ['hi-IN', 'kn-IN', 'te-IN', 'ta-IN', 'en-IN'];

export async function transcribeAudioBase64(audioBase64, encoding = 'WEBM_OPUS', sampleRateHertz = 48000) {
  if (!audioBase64) {
    throw new Error('No audio data provided');
  }

  const audio = { content: audioBase64 };

  const config = {
    encoding,
    sampleRateHertz,
    languageCode: 'hi-IN',
    alternativeLanguageCodes: LANGUAGE_HINTS.filter((l) => l !== 'hi-IN'),
    enableAutomaticPunctuation: true,
    model: 'default',
  };

  const [response] = await client.recognize({ audio, config });
  const transcript = response.results
    ?.map((r) => r.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(' ');

  if (!transcript) {
    throw new Error('Could not transcribe audio. Please speak clearly or use a preset.');
  }

  return {
    transcript,
    confidence: response.results?.[0]?.alternatives?.[0]?.confidence ?? 0.8,
    languageCode: response.results?.[0]?.languageCode ?? 'hi-IN',
  };
}
