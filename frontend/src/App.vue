<template>
  <div class="bg-gray-800 h-screen flex w-full items-center justify-center">
    <div class="flex flex-col container mx-auto h-full items-center justify-center">
      <div class="bg-gray-900 p-6 rounded-lg flex flex-col md:flex-row h-[50%] w-full">
        <div class="video-container flex-1 m-2 border border-gray-700 flex flex-col justify-center items-center">
          <audio ref="audioPlayer" controls class="hidden"></audio>
          <div class="avatar">
            <div class="w-24 rounded-full ring ring-offset-base-100 ring-offset-2" :class="{'ring-success':isPlaying}">
              <img :src="AiAvatar" />
            </div>
          </div>
        </div>
        <div class="video-container flex-1 m-2 border border-gray-700 flex flex-col justify-center items-center">
          <div class="avatar">
            <div class="w-24 rounded-full ring ring-offset-base-100 ring-offset-2" :class="{'ring-success':isRecording > 0}">
              <img :src="UserAvatar" />
            </div>
          </div>
        </div>
      </div>
      <div class="p-6 rounded-lg flex items-center justify-center mt-6">
        <button
          class="btn"
          :class="{'btn-success':!isRecording, 'btn-error': isRecording}"
          @click="toggleRecording()"
          >
          {{ isRecording ? 'Stop Listening' : 'Start Listening' }}
        </button>
      </div>
    </div>
    <div class="h-full w-full max-w-lg bg-gray-900 self-end p-4 overflow-y-scroll">
      <template v-if="chatHistory.length">
        <div
          class="chat mb-2"
          v-for="(m, index) in chatHistory"
          :key="index"
          :class="{'chat-start': m.from == 'ai', 'chat-end': m.from == 'user'}"
          >
          <div class="chat-image avatar">
            <div class="w-10 rounded-full">
              <img :src="m.from == 'ai'? AiAvatar : UserAvatar" />
            </div>
          </div>
          <div
            class="chat-bubble"
            :class="{'chat-bubble-primary': m.from == 'ai'}"
            >
            {{m.message}}
          </div>
        </div>
      </template>
      <div class="mt-4" v-if="isInProgress">
        <span class="loading loading-ball loading-xs" v-for="n in 3" :key="n"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import axios from 'axios'
  import { useSpeechRecognition } from '@vueuse/core'
  import AiAvatar from '@/assets/images/ai-avatar.jpg'
  import UserAvatar from '@/assets/images/user-avatar.png'

  const api_base = import.meta.env.VITE_API_BASE_URL
  console.log(api_base)

  const { isListening, isFinal, result, start, stop } = useSpeechRecognition({
    continuous: true,
    lang: 'en-US',
  })
  const recognizedText = ref<strong>('')

  const isRecording = ref(false)
  let mediaRecorder: MediaRecorder | null = null
  const chunks: Blob[] = []
  const audioPlayer = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref<boolean>(false)
  const isInProgress = ref<boolean>(false)
  const chatHistory = ref<object[]>([])

  watch(
    result,
    (newResult) => {
      recognizedText.value = newResult
      if(recognizedText.value.length > 0) {
        chatHistory.value[chatHistory.value.length-1].message = recognizedText.value
      }
    },
    { immediate: true }
  )

  const startListening = async () => {
    if(!isRecording.value) return
    start() 
    console.log('Starting detecting silence.')
    chatHistory.value.push({
      from: 'user',
      message: '...',
    })
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    let silenceCounter = 0
    const silenceThreshold = 100

    const checkSilence = async () => {
      if(!isRecording.value) return
      analyser.getByteFrequencyData(dataArray)
      const isSilent = dataArray.every((value) => value < silenceThreshold)

      if (isSilent) {
        silenceCounter++
      } else {
        silenceCounter = 0
      }

      if (silenceCounter > 299) {
        console.log(`Silence detected for the last ${silenceCounter} frames. Stopping recognition and checking for text.`)
        if(recognizedText.value.length > 0) {
          stop()
          isRecording.value = false
          console.log('Text recognized:', recognizedText.value)
          console.log('Sending to the server ...')
          await sendAudioToServer(recognizedText.value)
          console.log('Response received from the server.')
          recognizedText.value = ''
          silenceCounter = 0
        } else {
          console.log('No text recognized.')
          silenceCounter = 0
          checkSilence()
        }
      } else {
        requestAnimationFrame(checkSilence)
      }
    }

    checkSilence()
  }

  const toggleRecording = () => {
    isRecording.value = !isRecording.value
    console.log('Toggling recording', isRecording.value)
    if (!isRecording.value) {
      stop()
      if (chatHistory.value[chatHistory.value.length-1].message == '...') {
        chatHistory.value.pop()
      }
      console.log('Recording stopped.')
    } else {
      console.log('Recording is not started.')
      startListening()
    }
  }

  const sendAudioToServer = async (transcribedText) => {
    isInProgress.value = true
    try {
      const response = await axios.post(api_base+'recording', { text: transcribedText }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 200) {
        const audioDataURI = response.data.audio
        playAudio(audioDataURI)
        chatHistory.value.push({ from: 'ai', message: response.data.aiResponse })
      } else {
        console.error('Error sending audio to server')
      }
      isInProgress.value = false
    } catch (error) {
      console.error('Error sending audio to server:', error)
      isInProgress.value = false
    }
  }

  const playAudio = (audioDataURI: string) => {
    if (audioPlayer.value) {
      console.log('Audio received. Playing...')
      isPlaying.value = true
      const audioContext = new AudioContext()
      fetch(audioDataURI)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
          const source = audioContext.createBufferSource()
          source.buffer = audioBuffer
          source.connect(audioContext.destination)
          source.onended = () => {
            console.log('Stop playing. Listening...')
            isPlaying.value = false
            isRecording.value = true
            startListening()
          }
          source.start()
          audioPlayer.value.src = audioDataURI
          audioPlayer.value.play()
        })
        .catch((error) => console.error('Error playing audio:', error))
    }
  }
</script>
