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

export default text2speech