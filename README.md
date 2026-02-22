# Rehab Assist

A web-based rehabilitation assistance platform for home-based stroke therapy using a standard webcam, browser-based pose estimation, and machine-learning–driven compensation detection.

## Overview
Rehab Assist is designed to support upper-limb rehabilitation by providing real-time movement analysis, personalized feedback, and therapist-in-the-loop supervision. The system uses a single RGB camera to extract skeletal keypoints in the browser, analyzes movement quality using machine learning, and presents progress metrics through dedicated patient and therapist dashboards.

## System Architecture
The platform follows a multi-tenant, service-oriented architecture:

- **Frontend**: React + TypeScript (Vite)  
  - Browser-based MediaPipe Pose landmark extraction  
  - Real-time feedback and session UI  

- **Backend**: Node.js + Express + MongoDB  
  - User authentication and role management  
  - Multi-tenant data isolation  
  - Session storage and therapist dashboards  

- **ML Service**: Python + FastAPI  
  - Real-time inference via WebSockets  
  - Sliding-window compensation classification  

Project Status

🚧 Work in progress