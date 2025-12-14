# Speed Test App 🚀

A modern web application to test internet connection speed with real-time animations and beautiful UI.

## Features ✨

- **Download Speed Test** - Measure your download bandwidth in Mbps
- **Upload Speed Test** - Test your upload speed
- **Ping/Latency Test** - Check network latency
- **Jitter Measurement** - Analyze connection stability
- **Beautiful Animations** - Smooth transitions with Framer Motion
- **Responsive Design** - Works on desktop and mobile devices
- **Real-time Updates** - Live speed gauge updates

## Tech Stack 💻

### Backend
- Node.js & Express
- TypeScript
- CORS support
- RESTful API

### Frontend
- React 18
- TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Axios (HTTP client)

## Getting Started 🎯

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd speed-test-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

   Or install separately:
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

### Running the Application

#### Option 1: Run both frontend and backend together (Recommended)
```bash
npm run dev
```

#### Option 2: Run separately
```bash
# Terminal 1 - Backend server (runs on port 3001)
cd server
npm run dev

# Terminal 2 - Frontend (runs on port 3000)
cd client
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

## API Endpoints 📡

- `GET /api/health` - Health check
- `GET /api/ping` - Latency test
- `GET /api/download?size=<bytes>` - Download speed test
- `POST /api/upload` - Upload speed test

## Project Structure 📁

```
speed-test-app/
├── server/                 # Backend Express server
│   ├── src/
│   │   └── index.ts       # Main server file
│   ├── package.json
│   └── tsconfig.json
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Entry point
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── package.json           # Root package.json
```

## Building for Production 🏗️

```bash
npm run build
```

This will build both the backend and frontend for production deployment.

## Environment Variables

Create a `.env` file in the `server` directory:
```
PORT=3001
```

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

ISC License

## Features

- Measure download speed
- Measure upload speed
- Measure ping and latency
- Assess connection stability
- Responsive design for various devices

## Project Structure

```
speed-test-app
├── public
│   ├── index.html        # Main HTML document
│   └── styles.css       # Styles for the application
├── src
│   ├── scripts
│   │   ├── speedTest.js  # Main logic for speed tests
│   │   └── utils.js      # Utility functions for speed tests
│   └── tests
│       └── speedTest.test.js # Unit tests for speed tests
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd speed-test-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To run the application, open `public/index.html` in your web browser. Click the buttons to initiate the speed tests and view the results displayed on the page.

## Running Tests

To run the unit tests, use the following command:
```
npm test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.