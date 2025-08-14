# Twitter Server API

HTTP server for managing Twitter accounts and fetching tweets. This server provides REST API endpoints for account management, tweet retrieval, and AI-powered tweet filtering.

**Live deployment:** https://tweets.nunosempere.com

## Overview

This server integrates with:
- PostgreSQL database for storing accounts and tweets
- Independent backend fetcher that runs every 10 minutes
- OpenAI's GPT models for intelligent tweet filtering

## Quick Start

### Prerequisites
- Go 1.19+
- PostgreSQL database
- OpenAI API key (for filtering features)

### Installation

1. Install dependencies:
```bash
go mod tidy
```

2. Set up environment variables (create `.env` file):
```env
DATABASE_POOL_URL=postgresql://username:password@localhost:5432/dbname
PORT=3344
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the server:
```bash
make run
# or
go run src/handlers.go src/main.go src/types.go
```

## API Reference

### Health Check
- **GET** `/api/health`
- Returns server status

### WebSocket Filtering

For long-running filter operations that may timeout with HTTP requests, use the WebSocket endpoint `/api/filter-ws`. This provides real-time progress updates and handles large datasets without timeouts.

**Connection:** `wss://tweets.nunosempere.com/api/filter-ws`

**Message Format:**
- **Outgoing** (client → server): Same `FilterRequest` format as HTTP endpoint
- **Incoming** (server → client): `WSMessage` with `type` and `data` fields

**Message Types:**
- `progress`: Real-time processing updates with `{processed, total, message}`
- `result`: Final `FilterResponse` when complete
- `error`: Error message if processing fails

**Benefits:**
- No timeouts for large datasets
- Real-time progress tracking
- Better user experience for long operations
- Automatic rate limiting (1000 req/sec to OpenAI)

### Account Management

#### Add Account
- **POST** `/api/accounts`
- **Body:** `{"username": "twitter_handle", "list": "optional_list_name"}`
- Adds a Twitter account to be fetched by the backend

**Example:**
```bash
curl -X POST https://tweets.nunosempere.com/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"username": "elonmusk", "list": "tech"}'
```

#### Get All Accounts
- **GET** `/api/accounts`
- Returns list of all accounts in the database

#### Delete Account
- **DELETE** `/api/accounts/{username}`
- Removes an account from the database

### Tweet Retrieval

#### Get All Tweets
- **GET** `/api/tweets?limit=100&list=ai-og`
- **Query params:**
  - `limit`: Number of tweets (default: 100, max: 1000)
  - `list`: Filter by list name (optional)

**Example:**
```bash
curl "https://tweets.nunosempere.com/api/tweets?list=ai-og&limit=100" | jq
```

#### Get Tweets from Specific Account
- **GET** `/api/tweets/{username}?limit=50`
- **Query params:**
  - `limit`: Number of tweets (default: 50, max: 1000)

**Example:**
```bash
curl "https://tweets.nunosempere.com/api/tweets/elonmusk?limit=50" | jq
```

### Tweet Filtering (AI-Powered)

#### Filter Tweets (HTTP)
- **POST** `/api/filter`
- Filter tweets using natural language questions with GPT-4o-mini
- **Note:** May timeout for large datasets (>500 tweets)

#### Filter Tweets (WebSocket)
- **WebSocket** `/api/filter-ws`
- Real-time progress updates for long-running filter operations
- No timeout issues, ideal for large datasets

**Request Body:**
```json
{
  "question": "Does this tweet discuss artificial intelligence or machine learning?",
  "users": ["OpenAI", "elonmusk", "AnthropicAI"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tweets filtered successfully",
  "data": {
    "filtered_tweets": [
      {
        "tweet": {
          "tweet_id": "123456789",
          "text": "Exciting developments in AI safety research...",
          "created_at": "2025-01-29T10:30:00Z",
          "username": "OpenAI"
        },
        "pass": true,
        "reasoning": "This tweet discusses AI safety research, which is directly related to artificial intelligence."
      }
    ],
    "count": 1,
    "question": "Does this tweet discuss artificial intelligence or machine learning?"
  }
}
```

**Features:**
- Loads tweets from the last 7 days for specified users
- Uses GPT-4o-mini for cost-effective filtering
- Rate limiting to 1000 requests/second
- Returns both passing and failing tweets with reasoning
- Parallel processing for efficiency

**HTTP Example:**
```bash
curl -X POST https://tweets.nunosempere.com/api/filter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Does this tweet mention cryptocurrency or Bitcoin?",
    "users": ["elonmusk", "VitalikButerin"]
  }'
```

**WebSocket Example (curl with websocat):**
```bash
# Install websocat: cargo install websocat
echo '{"question":"Does this tweet discuss AI?","list":"ai-og"}' | \
  websocat wss://tweets.nunosempere.com/api/filter-ws

# Or use wscat (npm install -g wscat):
echo '{"question":"Does this tweet discuss AI?","list":"ai-og"}' | \
  wscat -c wss://tweets.nunosempere.com/api/filter-ws
```

**WebSocket Example (JavaScript):**
```javascript
const ws = new WebSocket('wss://tweets.nunosempere.com/api/filter-ws');

ws.onopen = () => {
  // Send filter request
  ws.send(JSON.stringify({
    question: "Does this tweet discuss artificial intelligence?",
    list: "ai-og"
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'progress':
      console.log(`Progress: ${message.data.processed}/${message.data.total} - ${message.data.message}`);
      break;
    case 'result':
      console.log('Final result:', message.data);
      ws.close();
      break;
    case 'error':
      console.error('Error:', message.data.error);
      ws.close();
      break;
  }
};
```

## Response Format

All API responses follow this consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Description of the result",
  "data": { /* Response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Error Codes:**
- 400: Invalid JSON, missing required fields, or invalid parameters
- 404: Account or resource not found
- 500: Database connection failed, OpenAI API errors, or internal server errors

## Database Schema

The server integrates with a PostgreSQL database:
- **`tweet_accounts` table**: Stores Twitter accounts to fetch
- **`tweets0x001` table**: Stores fetched tweets
- Backend fetcher runs independently every 10 minutes

## Deployment

### Production Setup (tweets.nunosempere.com)

The server is deployed on `sealtiel@trastos.nunosempere.com` with:

1. **Systemd service** (`twitter-public.service`):
```bash
make systemd  # Install and start service
make status   # Check service status
make logs     # View service logs
```

2. **Nginx reverse proxy** (port 3344 → 80/443):
```bash
make nginx    # Configure Nginx with SSL
```

3. **SSL certificate** via Let's Encrypt (automatic)

### Development Commands

```bash
make run      # Start development server
make build    # Build binary
make test     # Run tests
make install  # Install dependencies
make clean    # Remove build artifacts
```

### Environment Variables

**Required:**
- `DATABASE_POOL_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3344)

**Optional:**
- `OPENAI_API_KEY`: Required for `/api/filter` endpoint

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend/TUI  │───▶│ HTTP Server  │───▶│ PostgreSQL  │
│                 │    │ (port 3344)  │    │ Database    │
└─────────────────┘    └──────────────┘    └─────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ OpenAI API   │
                       │ (Filtering)  │
                       └──────────────┘
```

## Examples

### Complete Workflow

1. **Add accounts to track:**
```bash
curl -X POST https://tweets.nunosempere.com/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"username": "OpenAI", "list": "ai-companies"}'

curl -X POST https://tweets.nunosempere.com/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"username": "AnthropicAI", "list": "ai-companies"}'
```

2. **Wait for backend fetcher to collect tweets (runs every 10 minutes)**

3. **Retrieve tweets:**
```bash
# Get all tweets from AI companies list
curl "https://tweets.nunosempere.com/api/tweets?list=ai-companies&limit=100" | jq

# Get tweets from specific account
curl "https://tweets.nunosempere.com/api/tweets/OpenAI?limit=50" | jq
```

4. **Filter tweets with AI:**
```bash
curl -X POST https://tweets.nunosempere.com/api/filter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Does this tweet announce a new AI model or research?",
    "users": ["OpenAI", "AnthropicAI"]
  }' --max-time 180 | jq
```

Also accepts a `list` argument.

## Troubleshooting

### Common Issues

1. **Database connection failed:**
   - Check `DATABASE_POOL_URL` environment variable
   - Ensure PostgreSQL is running and accessible

2. **OpenAI API errors:**
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key has sufficient credits

3. **Service not starting:**
   ```bash
   make logs  # Check systemd logs
   make status # Check service status
   ```

### Monitoring

- **Service status:** `systemctl status twitter-public`
- **Logs:** `journalctl -u twitter-public.service -f`
- **Nginx logs:** `/var/log/nginx/access.log` and `/var/log/nginx/error.log`

## License

This project is part of the twitter-tools suite for personal tweet management and analysis.
