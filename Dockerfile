FROM ubuntu:bionic

RUN apt-get update && apt-get install -y \
	python3.6 \
	python3-pip \
	python3-virtualenv \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN python3.6 -m virtualenv -p python3.6 /venv
COPY requirements.txt ./
RUN /venv/bin/pip install -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED 1
ENV PATH="$PATH:/venv/bin"
EXPOSE 80
CMD ["python", "-m", "alpaca"]
