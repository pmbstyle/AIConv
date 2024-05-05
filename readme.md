# Voice Assistant App

This is a web application that allows users to record their voice, send the audio to a server for processing, and receive an AI-generated response in the form of synthesized speech.

## Features

- Record audio from the user's microphone
- Send the recorded audio to the server for processing
- Receive an AI-generated response from the server
- Play the synthesized speech response in the browser

## Technologies Used

### Backend

- Node.js
- Express.js
- Multer (for handling file uploads)
- dotenv (for loading environment variables)
- cors (for handling Cross-Origin Resource Sharing)

The backend server is responsible for handling the following routes:

- `/synthesize`: Accepts text input and returns a synthesized speech audio file
- `/chat`: Accepts text input and returns an AI-generated response
- `/recording`: Accepts an audio file, transcribes the audio to text, generates an AI response, and returns a synthesized speech audio file

### Frontend

- Vue.js
- Axios (for making HTTP requests)

The frontend is a Vue.js application that provides a user interface for recording audio, sending it to the server, and playing the synthesized speech response.

## Getting Started

1. Clone the repository
2. Install dependencies for both the backend and frontend:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3. Start the backend server: `cd backend && npm start`
4. Start the frontend development server: `cd ../frontend && npm run dev`
5. Open your browser and navigate to `http://localhost:5173` (or the URL provided by the frontend development server)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).
# Voice Assistant App

This is a web application that allows users to record their voice, send the audio to a server for processing, and receive an AI-generated response in the form of synthesized speech.

## Features

- Record audio from the user's microphone
- Send the recorded audio to the server for processing
- Receive an AI-generated response from the server
- Play the synthesized speech response in the browser

## Technologies Used

### Backend

- Node.js
- Express.js
- Multer (for handling file uploads)
- dotenv (for loading environment variables)
- cors (for handling Cross-Origin Resource Sharing)

The backend server is responsible for handling the following routes:

- `/synthesize`: Accepts text input and returns a synthesized speech audio file
- `/chat`: Accepts text input and returns an AI-generated response
- `/recording`: Accepts an audio file, transcribes the audio to text, generates an AI response, and returns a synthesized speech audio file

### Frontend

- Vue.js
- Axios (for making HTTP requests)

The frontend is a Vue.js application that provides a user interface for recording audio, sending it to the server, and playing the synthesized speech response.

## Getting Started

1. Clone the repository
2. Install dependencies for both the backend and frontend:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3. Start the backend server: `cd backend && npm start`
4. Start the frontend development server: `cd ../frontend && npm run dev`
5. Open your browser and navigate to `http://localhost:5173` (or the URL provided by the frontend development server)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have any improvements or bug fixes.

## License

This project is licensed under the [MIT License](LICENSE).
