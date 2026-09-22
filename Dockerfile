FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.lock .
RUN pip install --no-cache-dir -r requirements.lock

# Copy project files
COPY backend/ ./backend/
COPY web/ ./web/

EXPOSE 8000
ENV PORT=8000

CMD ["python", "backend/main.py"]
