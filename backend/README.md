# Mindmarks Backend

A FastAPI backend for the Mindmarks application.

## Getting Started with Docker

### Prerequisites

- Docker installed on your system
- Docker Compose (optional, for local development)

### Building the Docker Image

```bash
# Navigate to the backend directory
cd backend

# Build the Docker image
docker build -t mindmarks-backend .
```

### Running the Docker Container

```bash
# Run the container
docker run -p 8000:8000 mindmarks-backend
```

The API will be available at [http://localhost:8000](http://localhost:8000)

### Environment Variables

You can customize the application by passing environment variables:

```bash
# Example with environment variables for database connection
docker run -p 8000:8000 \
  -e DB_HOST=your_db_host \
  -e DB_PORT=5432 \
  -e DB_USERNAME=your_username \
  -e DB_PASSWORD=your_password \
  -e DB_DATABASE=your_database \
  -e SECRET_KEY=your_secret_key \
  mindmarks-backend
```

For connecting to a Neon database (example):

```bash
docker run -p 8000:8000 \
  -e DB_HOST=ep-example-project-12345.us-east-1.aws.neon.tech \
  -e DB_USERNAME=neondb_owner \
  -e DB_DATABASE=neondb \
  -e DB_PASSWORD=your_password \
  -e DB_PORT=5432 \
  -e SECRET_KEY=your_secret_key \
  mindmarks-backend
```

## API Documentation

When the application is running, access the API documentation at:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Development (without Docker)

If you prefer to run the application without Docker:

1. Install Python 3.11
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the application:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ``` 