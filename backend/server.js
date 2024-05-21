import * as dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { text2speech, text2speechLocal } from './functions/text2speech.js'
import ollamaChat from './functions/ollama_chat.js'
import groqChat from './functions/groq_chat.js'

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const allowedOrigins = ['http://localhost:5173', 'http://localhost:80', 'http://localhost:8080']
app.use(cors({
    origin: allowedOrigins
}))

const llmSource = process.env.LLM_SOURCE || 'groq' // 'groq' or 'ollama'
const ttsSource = process.env.TTS_SOURCE || 'local' // 'local' or 'eleven'

// Routes
app.post('/recording', async (req, res) => {
    const transcribedText = req.body.text

    try {
        // Get AI response
        let aiResponse
        switch (llmSource) {
            case 'ollama':
                aiResponse = await ollamaChat(transcribedText)
                break
            case 'groq':
                aiResponse = await groqChat(transcribedText)
                break
            default:
                return res.status(400).send({ error: 'LLM source is not configured.' })
        }

        // Get TTS response
        let audioDataURI
        switch (ttsSource) {
            case 'local':
                audioDataURI = await text2speechLocal(aiResponse)
                break
            case 'eleven':
                audioDataURI = await text2speech(aiResponse)
                break
            default:
                return res.status(400).send({ error: 'TTS source is not configured.' })
        }

        if (typeof audioDataURI === 'string') {
            res.send({
                userMessage: transcribedText,
                aiResponse: aiResponse,
                audio: audioDataURI
            })
        } else {
            res.status(500).send('Error occurred while processing the request.')
        }
    } catch (error) {
        console.error('Error in /recording route:', error)
        res.status(500).send({ error: 'An error occurred while processing the request.' })
    }
})

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})
