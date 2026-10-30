git add .# Sanitix - Smart Hygiene and Sanitation Management System

Sanitix is an innovative smart hygiene and sanitation management system designed to improve cleanliness monitoring in public and private spaces. The project focuses on ensuring timely maintenance of sanitation facilities such as restrooms, waste disposal units, and public hygiene areas using modern technology.

## Features

1. **AI-Powered Citizen Reporting**
   - Report sanitation issues through text, voice, or image inputs
   - Automatic GPS tagging for accurate location mapping
   - Improves transparency and participation in urban hygiene management

2. **Intelligent Issue Analysis & Prediction**
   - Automatic classification of complaints using NLP
   - Severity detection from images using Computer Vision
   - Prediction of high-risk sanitation zones for proactive management

3. **Smart Waste & Resource Management**
   - Simulated IoT bin sensors integrated with Firebase
   - Real-time waste level monitoring
   - Optimized waste collection schedules and predictive maintenance

4. **Workforce & Community Collaboration**
   - AI-based workforce management for sanitation workers
   - Automated zone-wise task allocation
   - Manpower needs prediction
   - Collaboration with NGOs and community stakeholders

## Project Structure

- `frontend/` - Next.js application for the web interface
- `backend/` - Python FastAPI server with AI models
- `.github/` - GitHub configuration

## Getting Started

### Prerequisites

- Node.js
- Python 3.8+
- Firebase account (for full functionality)

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   python app.py
   ```
   Or use the VS Code task "Run Backend Server"

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
   Or use the VS Code task "Run Frontend Dev Server"

3. Open http://localhost:3000 in your browser

## Technologies Used

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, Uvicorn
- **AI/ML:** Transformers, Torch, OpenCV, SpaCy
- **Database:** Firebase Firestore
- **APIs:** Geopy for geocoding

## Contributing

Contributions are welcome! Please read the contributing guidelines first.

## License

This project is licensed under the MIT License.