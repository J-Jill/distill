# Distill API

## Authentication
This API uses API keys for authentication. Include your key in the `Authorization` header as `Bearer YOUR_KEY`.

## Endpoints

### POST /api/query
Sends a question and returns a streamed response based on ingested documentation.

### POST /api/ingest/file
Upload a PDF, .md, or .txt file to add to the knowledge base.

## Rate Limits
The API allows 100 requests per minute per API key.