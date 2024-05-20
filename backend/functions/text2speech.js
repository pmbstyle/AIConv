import * as dotenv from "dotenv"
dotenv.config()
import axios from "axios"
const text2speech = async (text) => {
    console.log("Synthesizing audio...", text)
    const model_id = 'eleven_multilingual_v2'
    const voice = 'henQIByl1UuBowZa1YoC'

    const voice_settings = {
        stability: 0.75,
        similarity_boost: 0.75,
    }

    try {
        const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
        {
            text: text.replace(/"/g, '\\"'),
            model_id: model_id,
            voice_settings: voice_settings,
        },
        {
            headers: {
            'Content-Type': 'application/json',
            accept: 'audio/mpeg',
            'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
            },
            responseType: 'arraybuffer',
        }
        )

        const audioBuffer = Buffer.from(response.data, 'binary')
        const base64Audio = audioBuffer.toString('base64')
        const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`

        return audioDataURI
    } catch (error) {
        console.error(error)
        return {
            error:'Error occurred while processing the request.',
            error_message: error.message
        }
    }
}
const text2speechLocal = async (text) => {
    console.log("Synthesizing audio using local server...", text)

    try {
        const response = await axios.post(
        'http://127.0.0.1:5000/tts',
        {
            text: text.replace(/"/g, '\\"')
        },
        {
            headers: {
            'Content-Type': 'application/json',
            accept: 'audio/mpeg',
            },
            responseType: 'arraybuffer',
        }
        )

        const audioBuffer = Buffer.from(response.data, 'binary')
        const base64Audio = audioBuffer.toString('base64')
        const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`

        return audioDataURI
    } catch (error) {
        console.error(error)
        return {
            error:'Error occurred while processing the request.',
            error_message: error.message
        }
    }
}

export { text2speech, text2speechLocal }