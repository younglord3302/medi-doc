# Medi-Doc

A full stack medical records management system built with React, Node.js, and MongoDB.

## Features

- **Patient Management**: Register and manage patient information
- **Medical Records**: Store and track medical records and treatments
- **User Interface**: Clean, responsive React-based frontend
- **RESTful API**: Express.js backend with MongoDB database
- **Modern Architecture**: Well-structured, scalable full-stack application

## Project Structure

```
medi-doc/
├── client/                 # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Header.js
│   │   │   └── ...
│   │   ├── pages/         # Page components
│   │   │   ├── HomePage.js
│   │   │   ├── PatientsPage.js
│   │   │   └── ...
│   │   ├── services/      # API service functions
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   └── ...
├── server/                 # Node.js/Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/           # MongoDB schemas
│   │   ├── Patient.js
│   │   ├── MedicalRecord.js
│   │   └── ...
│   ├── routes/           # API route definitions
│   │   ├── patients.js
│   │   ├── records.js
│   │   └── ...
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── package.json          # Root package.json with scripts
└── README.md
```

## Tech Stack

### Frontend (Client)
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls
- **CSS3**: Custom styling with responsive design

### Backend (Server)
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **CORS**: Cross-origin resource sharing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/medi-doc.git
   cd medi-doc
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   - Copy `server/.env` and update the MongoDB connection string
   - Update `MONGODB_URI` with your MongoDB connection string

4. **Start the development servers**
   ```bash
   # Start both client and server concurrently
   npm run dev

   # Or start individually:
   # npm run client    # React app on port 3000
   # npm run server    # Express server on port 5000
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Available Scripts

In the root directory:
- `npm run dev` - Start both client and server in development mode
- `npm run client` - Start React development server
- `npm run server` - Start Express server with nodemon
- `npm run build` - Build React app for production
- `npm start` - Start production server
- `npm run install-all` - Install dependencies for both client and server

## API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Medical Records
- `GET /api/records` - Get all medical records
- `GET /api/records/:id` - Get record by ID
- `GET /api/records/patient/:patientId` - Get records by patient ID
- `POST /api/records` - Create new medical record
- `PUT /api/records/:id` - Update medical record
- `DELETE /api/records/:id` - Delete medical record

## Development Guidelines

### Branch Strategy
- `main` - Production-ready code
- `dev` - Development branch
- `feature/*` - Feature branches

### Contributing
1. Create a feature branch from `dev`
2. Make your changes
3. Commit with descriptive messages
4. Create a pull request back to `dev`

## License

This project is licensed under the ISC License.
