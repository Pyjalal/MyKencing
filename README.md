# MyMedix API

A production-ready REST API for searching Malaysian medicines and checking drug interactions. Built with modern web technologies, this API scrapes data from QUEST3+ (Malaysian pharmaceutical database) and integrates with Stockley's drug interaction database to provide comprehensive medication safety information.

## 🌟 Features

- **🔍 Medicine Search**: Fast search across Malaysian pharmaceutical database (QUEST3+)
- **⚠️ Drug Interaction Checking**: Comprehensive interaction analysis using Stockley's database
- **⚡ Smart Caching**: In-memory caching with TTL for optimal performance
- **💾 Persistent Storage**: Supabase integration for medicine-ingredient mappings
- **✅ Type-Safe**: Full TypeScript implementation with Zod validation
- **🧪 Well-Tested**: Comprehensive test coverage with Jest

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account ([sign up here](https://supabase.com))
- Valid Stockley API cookies (from medicinescomplete.com)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mymedix_api

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Health Check

Check if the API is running and get environment information.

```http
GET /
```

**Response:**
```json
{
  "message": "Hono Medicine API",
  "version": "1.0.0",
  "status": "healthy",
  "environment": "development",
  "runtime": "node"
}
```

### Medicine Endpoints

#### Search Medicines

Search for medicines by name in the QUEST3+ database.

```http
GET /api/medicines/search?q={searchTerm}
```

**Parameters:**
- `q` (required): Search query (1-100 characters)

**Example Request:**
```bash
curl "http://localhost:3000/api/medicines/search?q=panadol"
```

**Example Response:**
```json
{
  "results": [
    {
      "id": "MAL19950015",
      "name": "PANADOL TABLET 500MG",
      "activeIngredients": ["Paracetamol"]
    },
    {
      "id": "MAL20051234",
      "name": "PANADOL EXTRA CAPLET",
      "activeIngredients": ["Paracetamol", "Caffeine"]
    }
  ]
}
```

#### Get Medicine Details

Get detailed information about a specific medicine.

```http
GET /api/medicines/{registrationNo}
```

**Parameters:**
- `registrationNo` (required): Medicine registration number (e.g., MAL19950015)

**Example Request:**
```bash
curl "http://localhost:3000/api/medicines/MAL19950015"
```

**Example Response:**
```json
{
  "id": "MAL19950015",
  "name": "PANADOL TABLET 500MG",
  "activeIngredients": ["Paracetamol"]
}
```

### Interaction Endpoints

#### Check Drug Interactions

Check for interactions between multiple medicines.

```http
POST /api/interactions/check
Content-Type: application/json
```

**Request Body:**
```json
{
  "medicineIds": ["MAL19950015", "MAL19920123"],
  "foodDrinkTobacco": false
}
```

**Parameters:**
- `medicineIds` (required): Array of medicine registration numbers (1-10 medicines)
- `foodDrinkTobacco` (optional): If true, checks for food/drink/tobacco interactions only. Default: false

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/interactions/check" \
  -H "Content-Type: application/json" \
  -d '{
    "medicineIds": ["MAL19950015", "MAL19920123"],
    "foodDrinkTobacco": false
  }'
```

**Example Response:**
```json
{
  "count": 1,
  "interactions": [
    {
      "interactionId": "00000889",
      "firstReactant": "paracetamol",
      "secondReactant": "aspirin",
      "severity": "Moderate",
      "explanation": "Concurrent use may result in increased risk of gastrointestinal bleeding...",
      "action": "Monitor for signs of bleeding. Consider alternative analgesics.",
      "warningCode": "guidanceNeeded",
      "actionRating": {
        "rating": "Monitor",
        "description": "Close monitoring or follow-up is recommended"
      },
      "severityRating": {
        "rating": "Moderate",
        "description": "Could result in noticeable effects requiring management"
      },
      "evidenceRating": {
        "rating": "Study",
        "description": "Based on formal clinical studies"
      }
    }
  ],
  "medicines": [
    {
      "id": "MAL19950015",
      "name": "PANADOL TABLET 500MG",
      "activeIngredients": ["Paracetamol"]
    },
    {
      "id": "MAL19920123",
      "name": "ASPIRIN TABLET 300MG",
      "activeIngredients": ["Aspirin"]
    }
  ]
}
```

#### Get Cache Statistics

Get current cache statistics (debugging).

```http
GET /api/interactions/cache/stats
```

**Example Response:**
```json
{
  "cache": {
    "size": 15,
    "keys": [
      "interactions:aspirin,paracetamol",
      "interactions:ibuprofen,warfarin"
    ]
  }
}
```

#### Clear Cache

Clear the interaction cache (debugging).

```http
DELETE /api/interactions/cache
```

**Example Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Stockley API Configuration
STOCKLEY_COOKIES=MC_ANALYTICS=...; MC_ANALYTICS4=...; PLAY_SESSION=...

# Application Configuration
CACHE_TTL=3600000
PORT=3000
NODE_ENV=development
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Your Supabase project URL | - | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | - | ✅ |
| `STOCKLEY_COOKIES` | Authentication cookies for Stockley API | - | ✅ |
| `CACHE_TTL` | Cache time-to-live in milliseconds | 3600000 | ❌ |
| `PORT` | Server port number | 3000 | ❌ |
| `NODE_ENV` | Environment (development/production/test) | development | ❌ |

### Getting Stockley API Cookies

1. Visit [medicinescomplete.com](https://www.medicinescomplete.com)
2. Log in with valid credentials
3. Open browser DevTools (F12)
4. Go to Application/Storage → Cookies
5. Copy all cookie values as a semicolon-separated string

Example format:
```
MC_ANALYTICS=UA-12345; MC_ANALYTICS4=GTM-XXXXX; PLAY_SESSION=eyJhbG...
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```
---

**Note**: This API is intended for educational and development purposes. Always consult healthcare professionals for medical advice.
