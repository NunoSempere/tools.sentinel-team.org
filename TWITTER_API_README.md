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
PASSWORD=your_secret_password
```

3. Run the server:
```bash
make run
# or
go run src/handlers.go src/main.go src/types.go
```

**Note:** The server automatically creates the `filter_jobs` and `tweet_lists` tables on first startup if they don't exist.

## API Reference

### Health Check
- **GET** `/api/health`
- Returns server status

### Job-Based Filtering (Polling - Recommended)

For reliable, long-running filter operations, use the new job-based polling endpoints. This approach is more stable than WebSockets and handles large datasets without connection issues.

**Workflow:**
1. **Create Job:** `POST /api/filter-job` - Returns job ID immediately
2. **Poll Status:** `GET /api/filter-job/{id}/status` - Check progress and get partial results
3. **Get Results:** `GET /api/filter-job/{id}/results` - Retrieve complete results when done

**Benefits:**
- **Reliable:** No connection timeouts or WebSocket brittleness
- **Resumable:** Jobs survive browser refreshes and network interruptions
- **Scalable:** Background processing with database persistence
- **Progress Tracking:** Real-time progress via polling (1-2 second intervals)
- **Infrastructure Friendly:** Works with all proxies, firewalls, and load balancers
- **Job Persistence:** Completed jobs are retained for 24 hours before automatic cleanup

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

### List Management

#### Create or Update List
- **POST** `/api/lists`
- **Body:** `{"name": "list_name", "usernames": ["user1", "user2", "user3"]}`
- Creates a new list or updates an existing list with the specified usernames

**Example:**
```bash
curl -X POST https://tweets.nunosempere.com/api/lists \
  -H "Content-Type: application/json" \
  -d '{"name": "ai-experts", "usernames": ["OpenAI", "AnthropicAI", "DeepMind"]}'
```

#### Get All Lists
- **GET** `/api/lists`
- Returns all lists with their usernames and counts

**Example:**
```bash
curl "https://tweets.nunosempere.com/api/lists" | jq
```

This is the format which this response returns

```
{
  "success": true,
  "message": "Lists retrieved successfully",
  "data": [
    {
      "name": "ai",
      "usernames": [
        "xAI"
      ],
      "count": 1
    },
    {
      "name": "ai-og",
      "usernames": [
        "AIHegemonyMemes",
        "aixbt_agent",
        "truth_terminal"
      ],
      "count": 3
    },
    {
      "name": "forecasting",
      "usernames": [
        "Domahhhh",
        "JGalt",
        "MickBransfield",
        "PTetlock",
        "shayne_coplan"
      ],
      "count": 5
    },
    {
      "name": "freight",
      "usernames": [
        "FreightWaves",
        "SpencerHakimian"
      ],
      "count": 2
    },
    {
      "name": "nuno-following",
      "usernames": [
        "0xellipse",
        "0xperp",
        "42irrationalist",
        "7ip7ap",
        "zackmdavis",
        "zeta_globin",
        "zetalyrae",
        "zheanxu",
        ...
        "zmkzmkz"
      ],
      "count": 559
    },
    {
      "name": "signal",
      "usernames": [
        "artoriastech",
        "chefjoseandres",
        "ChinaBugle",
        "CNASdc",
        "criticalthreats",
        "elder_plinius",
        "ELuttwak",
        "JgaltTweets",
        "Mollyploofkins",
        "NWSSWPC",
        "OSINTNW",
        "SecDef",
        "sentdefender",
        "SteveWitkoff",
        "teortaxesTex",
        "typesfast",
        "VOCPEnglish",
        "zephyr_z9"
      ],
      "count": 18
    },
    {
      "name": "tech",
      "usernames": [
        "elonmusk"
      ],
      "count": 1
    },
    {
      "name": "typesfast",
      "usernames": [
        "FreightAlley"
      ],
      "count": 1
    },
    {
      "name": "whitehouse",
      "usernames": [
        "DODResponse",
        "howardlutnick",
        "JDVance",
        "marcorubio",
        "PamBondi",
        "PressSec",
        "RapidResponse47",
        "SecRubio",
        "tedcruz",
        "trump_repost",
        "VP",
        "WhiteHouse"
      ],
      "count": 12
    }
  ]
}
```

#### Get Specific List
- **GET** `/api/lists/{listName}`
- Returns details for a specific list

**Example:**
```bash
curl "https://tweets.nunosempere.com/api/lists/ai-experts" | jq
```

#### Edit/Replace List (Password Protected)
- **PUT** `/api/lists/{listName}/edit`
- **Body:** `{"usernames": ["user1", "user2", "user3"], "password": "your_password"}`
- Replaces an existing list's usernames (deletes old list and recreates it)
- Requires `PASSWORD` environment variable to be set
- Returns 401 if password is incorrect, 404 if list doesn't exist

**Example:**
```bash
curl -X PUT "https://tweets.nunosempere.com/api/lists/ai-experts/edit" \
  -H "Content-Type: application/json" \
  -d '{
    "usernames": ["OpenAI", "AnthropicAI", "DeepMind", "huggingface"],
    "password": "your_secret_password"
  }'
```

#### Delete List
- **DELETE** `/api/lists/{listName}`
- Removes a list from the database

**Example:**
```bash
curl -X DELETE "https://tweets.nunosempere.com/api/lists/old-list"
```

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

#### Filter Tweets (HTTP - Small Datasets)
- **POST** `/api/filter`
- Filter tweets using natural language questions with GPT-4o-mini
- **Note:** May timeout for large datasets (>500 tweets)
- **Recommended for:** Quick filters on small datasets

#### Filter Tweets (Job-Based Polling - Recommended)
- **POST** `/api/filter-job` - Create filter job
- **GET** `/api/filter-job/{id}/status` - Check job progress
- **GET** `/api/filter-job/{id}/results` - Get completed results
- No timeout issues, reliable for any dataset size
- **Recommended for:** All production use cases

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

**HTTP Example (Small Datasets):**
```bash
curl -X POST https://tweets.nunosempere.com/api/filter \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Does this tweet mention cryptocurrency or Bitcoin?",
    "users": ["elonmusk", "VitalikButerin"]
  }'
```

**Job-Based Polling Example (Recommended):**

**Note:** Examples require [jq](https://stedolan.github.io/jq/) for JSON processing.

```bash
# 1. Create filter job
JOB_RESPONSE=$(curl -X POST https://tweets.nunosempere.com/api/filter-job \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Does this tweet discuss artificial intelligence?",
    "list": "ai-og"
  }')

# Extract job ID
JOB_ID=$(echo $JOB_RESPONSE | jq -r '.data.job_id')
echo "Created job: $JOB_ID"

# 2. Poll for status until complete
while true; do
  STATUS=$(curl -s "https://tweets.nunosempere.com/api/filter-job/$JOB_ID/status")
  CURRENT_STATUS=$(echo $STATUS | jq -r '.data.status')
  
  echo "Status: $CURRENT_STATUS"
  
  if [ "$CURRENT_STATUS" = "completed" ]; then
    echo "Job completed!"
    break
  elif [ "$CURRENT_STATUS" = "failed" ]; then
    echo "Job failed: $(echo $STATUS | jq -r '.data.error_message')"
    exit 1
  fi
  
  # Show progress
  echo $STATUS | jq '.data.progress'
  
  sleep 2
done

# 3. Get results
curl "https://tweets.nunosempere.com/api/filter-job/$JOB_ID/results" | jq
```

**JavaScript Polling Client:**
```javascript
class FilterJobClient {
  async startFilter(request) {
    // 1. Create job
    const job = await fetch('/api/filter-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }).then(r => r.json());
    
    // 2. Poll for updates
    return this.pollForCompletion(job.data.job_id);
  }
  
  async pollForCompletion(jobId, retryCount = 0) {
    const pollInterval = 1000; // Start with 1 second
    let attempts = 0;
    
    while (attempts < 300) { // 5 minute timeout
      try {
        const status = await fetch(`/api/filter-job/${jobId}/status`)
          .then(r => r.json());
        
        // Update UI with progress
        this.updateProgress(status.data);
      
      if (status.data.status === 'completed') {
        return await fetch(`/api/filter-job/${jobId}/results`)
          .then(r => r.json());
      }
      
      if (status.data.status === 'failed') {
        throw new Error(status.data.error_message);
      }
      
        // Exponential backoff up to 5 seconds
        const delay = Math.min(pollInterval * Math.pow(1.5, attempts), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
      } catch (networkError) {
        console.warn(`Network error during polling (attempt ${retryCount + 1}):`, networkError);
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.pollForCompletion(jobId, retryCount + 1);
        } else {
          throw new Error(`Network error after 3 retries: ${networkError.message}`);
        }
      }
    }
    
    throw new Error('Job timeout after 5 minutes');
  }

  updateProgress(data) {
    console.log(`Progress: ${data.progress.current}/${data.progress.total} (${data.progress.percentage}%) - ${data.progress.message}`);
  }
}

// Usage
const client = new FilterJobClient();
client.startFilter({
  question: "Does this tweet discuss AI?",
  list: "ai-og"
}).then(results => {
  console.log('Filter completed:', results.data.results);
}).catch(error => {
  console.error('Filter failed:', error);
});
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
- **`tweet_lists` table**: Stores lists with comma-separated usernames (allows accounts in multiple lists)
- **`tweets0x001` table**: Stores fetched tweets
- **`filter_jobs` table**: Stores background filtering job status and results
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
- `PASSWORD`: Required for password-protected endpoints like `/api/lists/{listName}/edit`

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
