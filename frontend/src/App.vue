<template>
    <div>
        <button @click="startRecording" :disabled="isRecording">Start Recording</button>
        <button @click="stopRecording" :disabled="!isRecording">Stop Recording</button>
        <p v-if="isRecording">Recording...</p>
        <audio ref="audioPlayer" controls></audio>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const isRecording = ref(false);
let mediaRecorder: MediaRecorder | null = null;
const chunks: Blob[] = [];
const audioPlayer = ref<HTMLAudioElement | null>(null)

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      sendAudioToServer(blob);
      chunks.length = 0;
    };
    mediaRecorder.start();
    isRecording.value = true;
  } catch (error) {
    console.error('Error accessing microphone:', error);
  }
};

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    isRecording.value = false;
  }
};

const sendAudioToServer = async (blob: Blob) => {
  try {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');

    const response = await axios.post('http://localhost:3000/recording', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.status === 200) {
      console.log('Audio sent to server successfully');
      const audioDataURI = response.data.audio;
      playAudio(audioDataURI);
    } else {
      console.error('Error sending audio to server');
    }
  } catch (error) {
    console.error('Error sending audio to server:', error);
  }
};

const playAudio = (audioDataURI: string) => {
  if (audioPlayer.value) {
    const audioContext = new AudioContext();
    fetch(audioDataURI)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        audioPlayer.value.src = audioDataURI;
      })
      .catch((error) => console.error('Error playing audio:', error));
  }
};
</script>
