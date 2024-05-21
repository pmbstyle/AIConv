import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const synthesizeAudio = async (url, data, headers) => {
    try {
        const response = await axios.post(
            url,
            data,
            {
                headers: headers,
                responseType: 'arraybuffer',
            }
        );

        const audioBuffer = Buffer.from(response.data, 'binary');
        const base64Audio = audioBuffer.toString('base64');
        return `data:audio/mpeg;base64,${base64Audio}`;
    } catch (error) {
        console.error('Error in synthesizeAudio:', error);
        return {
            error: 'Error occurred while processing the request.',
            error_message: error.message,
        };
    }
};

const text2speech = async (text) => {
    console.log('Synthesizing audio...', text);
    const modelId = 'eleven_multilingual_v2';
    const voice = 'henQIByl1UuBowZa1YoC';
    const voiceSettings = {
        stability: 0.75,
        similarity_boost: 0.75,
    };
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;
    const headers = {
        'Content-Type': 'application/json',
        accept: 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
    };
    const data = {
        text: text.replace(/"/g, '\\"'),
        model_id: modelId,
        voice_settings: voiceSettings,
    };

    return synthesizeAudio(url, data, headers);
};

const text2speechLocal = async (text) => {
    console.log('Synthesizing audio using local server...', text);
    const url = 'http://127.0.0.1:5000/tts';
    const headers = {
        'Content-Type': 'application/json',
        accept: 'audio/mpeg',
    };
    const data = { text: text.replace(/"/g, '\\"') };

    return synthesizeAudio(url, data, headers);
};

export { text2speech, text2speechLocal };
