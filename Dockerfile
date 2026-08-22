FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY backend/ ./backend/
COPY web/ ./web/

EXPOSE 8000
ENV PORT=8000

CMD ["python", "backend/main.py"]
