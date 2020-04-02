FROM ubuntu:bionic

RUN apt-get update && \
    apt-get install -y \
        python3.7 \
        python3-pip \
        python3.7-dev \
        python3-gdbm \
    && \
    rm -rf /var/lib/apt/lists/*

RUN python3.7 -m pip install \
    google-api-python-client \
    google-auth \
    google-auth-oauthlib \
    google-auth-httplib2 \
    flask \
    flask_cors \
    requests

WORKDIR /app
COPY main.py client_secret.json ./

ENTRYPOINT ["python3.7", "main.py"]
CMD []
