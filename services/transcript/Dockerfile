FROM node:22-bookworm-slim AS node
FROM python:3.12-slim-bookworm
COPY --from=node /usr/local/bin/node /usr/local/bin/node
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY extract.py server.py ./
RUN useradd --uid 10001 --create-home elio && mkdir /data && chown elio:elio /data
USER elio
ENV HOST=0.0.0.0 PORT=8080 CACHE_DB=/data/transcripts.sqlite3 PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["python", "server.py"]
