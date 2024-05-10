import * as dotenv from "dotenv"
dotenv.config()
import express from "express"
import cors from 'cors'
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

const llm_source = process.env.LLM_SOURCE || 'groq' //'groq' or 'ollama'

app.post('/recording', async (req, res) => {
    const transcribedText = req.body.text
    let aiResponse;
    if(llm_source == 'ollama') {
        aiResponse = await ollama_chat(transcribedText)
    } else if(llm_source == 'groq') {
        aiResponse = await groq_chat(transcribedText)
    } else {
        return res.status(400).send({ error: 'LLM source is not configured.' })
    }
    const audioDataURI = await text2speech(aiResponse)

    if(typeof audioDataURI != Object) {
        res.send({ 
            userMessage:transcribedText,
            aiResponse:aiResponse,
            audio: audioDataURI
        })
    } else {
        res.status(500).send('Error occurred while processing the request.')
    }
})


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})
