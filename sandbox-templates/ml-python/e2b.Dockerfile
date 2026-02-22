FROM python:3.11-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    wget \
    build-essential \
    libgomp1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get autoremove -y

# Upgrade pip and clean up
RUN pip install --upgrade pip -q && pip cache purge

# Install essential packages only
RUN pip install -q numpy pandas scikit-learn matplotlib requests

# Create working directories
RUN mkdir -p /home/user/outputs/model \
    /home/user/outputs/plots \
    /home/user/outputs/data \
    /home/user/outputs/reports

WORKDIR /home/user

COPY start.sh /start.sh
RUN chmod +x /start.sh
