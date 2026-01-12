# 🚤 Idea Intake: Web Form → LLM → Google Sheets

A complete workflow system that captures product ideas through a web form, processes them with AI/LLM, and automatically structures them into a Lean Canvas in Google Sheets.

## Features

- **Web Form Interface**: Clean, modern form for submitting product ideas
- **AI-Powered Processing**: Automatically structures ideas using Claude AI via Perplexity API
- **Google Sheets Integration**: Writes processed ideas to a structured Google Sheets database
- **Lean Canvas Support**: Automatically generates Lean Canvas entries for each idea
- **Production-Ready**: Express.js backend with proper error handling and logging

## Architecture

```
Web Form (HTML/JS)
    ↓
  API Endpoint (/api/ideas)
    ↓
  LLM Processing (Perplexity API/Claude)
    ↓
  Google Sheets API
    ↓
  ProductIdeas Sheet
    ├─ Ideas sheet (idea_id, title, created_at, status, notes)
    └─ LeanCanvas sheet (idea_id, problem, segments, value, solution, channels, revenue, costs, metrics)
```

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Google Cloud Project** with:
   - Service Account created
   - Google Sheets API enabled
   - JSON key downloaded
3. **Google Sheet** named "ProductIdeas" with sheets:
   - Ideas: Columns A-E (idea_id, idea_name, created_at, status, notes)
   - LeanCanvas: Columns A-I (idea_id, problem, customer_segments, unique_value_proposition, solution, channels, revenue_streams, cost_structure, key_metrics)
4. **LLM API Key** (Perplexity AI or compatible service)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/nikita-tita/idea-intake.git
cd idea-intake
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with:
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google Cloud service account JSON key
- `GOOGLE_SHEET_ID`: The ID of your ProductIdeas Google Sheet
- `LLM_API_KEY`: Your Perplexity AI (or Claude) API key
- `LLM_MODEL`: Model to use (e.g., 'claude-3-5-sonnet')
- `PORT`: Server port (default: 3000)

### 4. Add Google Credentials

Place your downloaded JSON key file in the project root (or configure the path in `.env`):

```bash
# The filename should match GOOGLE_APPLICATION_CREDENTIALS in .env
cp /path/to/your/productideas-key.json ./productideas-key.json
```

### 5. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT)

## API Endpoints

### POST /api/ideas

Submit a new idea for processing.

**Request:**
```json
{
  "ideaTitle": "Smart Parking Assistant",
  "ideaDescription": "An AI-powered app that helps users find parking spots in cities using real-time data..."
}
```

**Response:**
```json
{
  "success": true,
  "ideaId": "a1b2c3d4",
  "message": "Idea processed and saved successfully",
  "data": {
    "problem": "Finding parking is time-consuming and frustrating",
    "customer_segments": "Urban drivers, commuters, delivery personnel",
    "unique_value_proposition": "AI-powered real-time parking availability",
    "solution": "Mobile app with ML predictions and live data",
    "channels": "App stores, partnerships with car manufacturers",
    "revenue_streams": "Subscription, premium features, B2B partnerships",
    "cost_structure": "Server costs, ML infrastructure",
    "key_metrics": "Users, conversion rate, retention"
  }
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

## Usage

1. Open `http://localhost:3000` in your browser
2. Fill in the idea title and description
3. Click "Submit Idea"
4. The idea will be processed by AI and saved to your Google Sheet
5. Check the "ProductIdeas" sheet to see your results

## Google Sheets Structure

### Ideas Sheet
Columns:
- **A: idea_id** - Unique identifier (e.g., "a1b2c3d4")
- **B: idea_name** - The title of the idea
- **C: created_at** - ISO timestamp when idea was submitted
- **D: status** - Processing status (e.g., "processed")
- **E: notes** - Brief description (first 500 chars)

### LeanCanvas Sheet
Columns:
- **A: idea_id** - Links to Ideas sheet
- **B: problem** - Main problem the idea solves
- **C: customer_segments** - Target customer segments
- **D: unique_value_proposition** - What makes it unique
- **E: solution** - How the product solves the problem
- **F: channels** - Distribution channels
- **G: revenue_streams** - How you make money
- **H: cost_structure** - Main cost drivers
- **I: key_metrics** - Success metrics

## Environment Variables Reference

```env
# Server
PORT=3000                                          # Server port
NODE_ENV=development                               # Environment

# Google Cloud
GOOGLE_APPLICATION_CREDENTIALS=./productideas-key.json
GOOGLE_SHEET_ID=your_sheet_id_here

# LLM
LLM_API_KEY=your_api_key_here
LLM_MODEL=claude-3-5-sonnet                       # or other model
```

## Troubleshooting

### Google Sheets API Error
- Ensure the service account has editor access to the Google Sheet
- Check that `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Verify the sheet names are exactly "Ideas" and "LeanCanvas"

### LLM Processing Errors
- Verify your LLM API key is valid
- Check API quota/rate limits
- The system has a fallback that uses basic text extraction if LLM fails

### Port Already in Use
```bash
# Change the port in .env
PORT=3001
```

## Deployment

### Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set GOOGLE_APPLICATION_CREDENTIALS=$(cat ./productideas-key.json | base64)
```

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
