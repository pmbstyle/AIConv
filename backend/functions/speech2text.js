import FormData from 'form-data'
import fetch from 'node-fetch'

const speech2text = async (audioBlob) => {
    console.log("Transcribing audio...")

    const formData = new FormData()
    formData.append("file", audioBlob, "recording.wav")
    formData.append("model", "whisper-1")

    const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                ...formData.getHeaders(),
        },
        body: formData,
    })
    .then(async (response) => {
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`)
        }
        const data = await response.json()
        return data.text
    })
    .catch((err) => {
        console.error("Audio transcription failed:", err)
        return null
    })

    return transcriptionResponse
}

export default speech2text