# Medi Prescribe AI - Advanced Medical Transcription & Clinical Assistant

A comprehensive, AI-powered medical transcription and clinical decision support system designed for modern healthcare professionals. Medi Prescribe AI allows doctors to record patient consultations, automatically transcribe them with high accuracy, generate structured medical summaries, construct patient knowledge graphs, and proactively flag clinical alerts.

## 🚀 Key Features

### 🎙️ Audio Transcription & Diarization

- **Real-time & Batch Recording**: Record doctor-patient consultations directly in the browser or upload pre-recorded audio files.
- **Lightning-Fast Transcription**: Uses **Groq's Whisper Large-v3** for near-instant, highly accurate medical transcription.
- **AI Speaker Diarization**: Uses LLaMA-3.3-70b to post-process transcripts and separate dialogue clearly between the Doctor and Patient.

### 🧠 AI-Powered Clinical Summaries

- **Structured Medical Documentation**: Automatically generates standard medical notes including Chief Complaint, History of Present Illness, Assessment, and Plan.
- **Patient-Facing After-Visit Summary**: Translates complex medical jargon into a simplified, 8th-grade reading level summary that can be exported directly as a **PDF**.
- **Data Extraction**: Automatically identifies and categorizes symptoms, diagnoses, allergies, and prescribed medications.

### 💊 Smart E-Prescription & Clinical Decision Support

- **Automated Draft Prescriptions**: Detects newly prescribed medications from the transcript and generates structured e-prescriptions including dosage, frequency, and duration.
- **Clinical Decision Support (Alerts)**: Cross-references newly prescribed medications against the patient's existing allergies and current medications (pulled from the Neo4j Knowledge Graph). Immediately flags potential **drug interactions** or **allergy conflicts**.

### 🕸️ Knowledge Graph & RAG (Retrieval-Augmented Generation)

- **Patient Knowledge Graph**: Uses **Neo4j** to build and maintain a persistent medical history for each patient across multiple sessions.
- **Context-Aware AI**: Injects the patient's historical graph data (known diagnoses, past medications, previous symptoms) into the LLM context to ensure summaries and clinical alerts are fully personalized.
- **Reflexive Question Generation**: Generates contextual, dynamic questions for the doctor (Clinical, Follow-up, Differential Diagnosis) based on the current transcript *and* the patient's long-term medical history.

## 🛠️ Tech Stack

### Core AI & Infrastructure

- **Groq API**: Powers all AI features for ultra-low latency inference.
  - *Audio Transcription*: `whisper-large-v3`
  - *LLM / Text Generation*: `llama-3.3-70b-versatile`
- **Neo4j**: Graph database for maintaining the Patient Knowledge Graph and enabling RAG.
- **MongoDB**: Primary NoSQL database for sessions, raw transcriptions, and summary metadata.
- **Redis**: In-memory caching and session state management.
- **Docker & Docker Compose**: Fully containerized microservices architecture.

### Backend

- **Node.js / Express.js**: RESTful API architecture.
- **Socket.IO**: Real-time bidirectional communication for live transcription updates.
- **PDFKit**: Server-side generation of patient summaries.
- **Winston**: Comprehensive application logging.
- **Jest**: Unit testing framework for services.

### Frontend

- **React 18**: Dynamic Single Page Application.
- **Material-UI (MUI)**: Responsive, modern, and accessible medical interface.
- **Socket.IO Client**: Handles live streaming data.

---

## 📋 Prerequisites

Ensure you have the following installed before proceeding:

- **Docker** and **Docker Compose**
- **Git**

### Required API Keys

1. **Groq API Key**: Get a free key from [Groq Console](https://console.groq.com/).

---

## 🚀 Quick Start (Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/lav24fr/Medi-Prescribe
cd Medi-Prescribe
```

### 2. Environment Setup

Copy the environment template in the backend directory:

```bash
cp backend/env.example backend/.env
```

Edit `backend/.env` and insert your Groq API key:

```env
# Required - Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Database Configuration (Docker Defaults)
MONGO_URI=mongodb://admin:password123@mongo:27017/mediscribe-ai?authSource=admin
REDIS_URL=redis://:redispassword123@redis:6379
GRAPHDB_URI=bolt://neo4j:7687
GRAPHDB_USER=neo4j
GRAPHDB_PASSWORD=password123

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

### 3. Run with Docker Compose

Start all services (Frontend, Backend, MongoDB, Redis, and Neo4j) in the background:

```bash
docker-compose up -d --build
```

Access the application:

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001](http://localhost:5001)
- **Neo4j Browser**: [http://localhost:7474](http://localhost:7474)

---

## 📖 Usage Guide

### Starting a Consultation

1. Navigate to [http://localhost:3000](http://localhost:3000).
2. Enter the **Doctor's Name** and the **Patient ID**. (Using the same Patient ID across multiple sessions will link them in the Knowledge Graph!)
3. Click **Start Session**.

### Recording & Transcription

1. Click **Start Recording** to capture real-time audio. The system will stream it and transcribe it using Whisper.
2. Alternatively, use **Upload Audio** for pre-recorded files (MP3, WAV, M4A).
3. The LLM will automatically diarize the transcript, labeling the "Doctor" and "Patient".

### AI Analysis & Summarization

1. Once transcription is complete, click **Generate Summary**.
2. Medi Prescribe AI will extract medical entities, build the structured clinical note, and generate the simplified Patient-Facing Summary.
3. If new medications are prescribed, check the **Smart E-Prescription** card.
4. If a drug interaction or allergy is detected based on the patient's history, a **Clinical Decision Support Alert** will be flagged immediately on the dashboard.
5. Export the simplified summary by clicking **Export PDF**.

---

## 🏗️ Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────────┐
│   React App     │    │   Express API   │    │      Groq Cloud      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   - Whisper (Audio)  │
└─────────────────┘    └─────────────────┘    │   - LLaMA-3.3 (Text) │
                               │              └──────────────────────┘
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼────┐  ┌──────▼──────┐  ┌────▼────────┐
        │  MongoDB   │  │    Redis    │  │    Neo4j    │
        │ (Sessions) │  │   (Cache)   │  │ (Knowledge) │
        └────────────┘  └─────────────┘  └─────────────┘
```

## 🧪 Testing

To run the backend test suite:

```bash
cd backend
npm install
npm test
```

## 🔒 Security & Privacy

- **`.gitignore` Enforced**: API keys, databases, and logs are intentionally ignored from version control.
- **Rate Limiting**: Protects backend endpoints from brute-force or abuse.
- **Ephemeral AI Processing**: Groq's privacy policy ensures data sent via API is not used to train underlying foundational models.

---
*Built to assist healthcare providers, streamline documentation, and protect patients with active clinical intelligence.*
