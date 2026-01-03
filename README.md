## Restaurant Finder

A web app to discover restaurants with accurate filtering (cost, distance, cuisine type) and menu display to help users understand what they're ordering. Future goal: recommendation system based on user text input.

### Stack

- **Frontend**: Next.js (App Router) + React + TypeScript + Tailwind CSS (`frontend` directory)
- **Backend**: FastAPI (Python) (`backend` directory)

### Getting started

#### 1. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** and **Maps JavaScript API** (for future map integration)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

#### 2. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Upgrade pip, setuptools, and wheel first (helps with pydantic-core build)
pip install --upgrade pip setuptools wheel

# Now install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

#### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Mapbox Access Token (get one free at https://account.mapbox.com/)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**Get a free Mapbox token:**
1. Go to [Mapbox](https://account.mapbox.com/)
2. Sign up for a free account
3. Go to "Access tokens"
4. Copy your default public token
5. Paste it in `.env.local`

#### 4. Run the backend

```bash
cd backend
source .venv/bin/activate  # if not already activated
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

#### 5. Run the frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`

### API Endpoints

- `GET /health` - Health check
- `GET /restaurants?lat={lat}&lng={lng}&radius={radius}&min_price={0-4}&max_price={0-4}&cuisine_type={type}` - Search restaurants with filters
- `GET /restaurants/{place_id}` - Get detailed restaurant information including menu data

### Running Tests

To run the backend tests:

```bash
cd backend
source .venv/bin/activate  # if not already activated

# Install test dependencies
pip install -r requirements-dev.txt

# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run a specific test file
pytest tests/test_restaurants.py

# Run tests with coverage
pytest --cov=main --cov-report=html
```

The tests use mocked Google Maps API calls, so they don't require a real API key or make actual API requests.



