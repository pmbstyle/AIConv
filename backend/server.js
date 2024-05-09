import * as dotenv from "dotenv"
dotenv.config()
import express from "express"
import cors from 'cors'
import multer from 'multer'
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
const allowedOrigins = ['http://localhost:5173', 'http://localhost:80', 'http://localhost:8080']
app.use(cors({
    origin: allowedOrigins
}))

import text2speech from "./functions/text2speech.js"
import ollama_chat from "./functions/ollama_chat.js"
import groq_chat from "./functions/groq_chat.js"
import speech2text from "./functions/speech2text.js"

const llm_source = process.env.LLM_SOURCE || 'groq' //'groq' or 'ollama'

const upload = multer()

app.post('/synthesize', async (req, res) => {
    const text = req.body.text

    if (!text) {
        res.status(400).send({ error: 'Text is required.' })
        return
    }

    const audioDataURI = await text2speech(text)

    if(typeof audioDataURL != Object) {
        res.send({ audioDataURI })
    } else {
        res.status(500).send('Error occurred while processing the request.')
    }
})

app.post('/chat', async (req, res) => {
    const text = req.body.text
    let response;
    if(llm_source == 'ollama') {
        response = await ollama_chat(text)
    } else if(llm_source == 'groq') {
        response = await groq_chat(text)
    }

    if(typeof response != Object) {
        res.send({ response })
    } else {
        res.status(500).send('Error occurred while processing the request.')
    }
})

app.post('/recording', upload.single('audio'), async (req, res) => {
    const audioBlob = req.file.buffer
    const transcribedText = await speech2text(audioBlob)
    let aiResponse;
    if(llm_source == 'ollama') {
        aiResponse = await ollama_chat(transcribedText)
    } else if(llm_source == 'groq') {
        aiResponse = await groq_chat(transcribedText)
    }
    const audioDataURI = await text2speech(aiResponse)

    if(typeof audioDataURI != Object) {
        res.send({ audio: audioDataURI })
    } else {
        res.status(500).send('Error occurred while processing the request.')
    }
})


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})
