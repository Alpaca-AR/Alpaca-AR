HOST = 0.0.0.0
PORT = 8080
TAG = alpaca:dev
DOCKER_RUN_FLAGS = --rm -p $(PORT):80 -v $(abspath .):/app:ro

.PHONY: all
all:

.PHONY: run
run: .mk.build
	docker run $(DOCKER_RUN_FLAGS) $(TAG)

.PHONY: inspect
inspect: .mk.build
	docker run -it $(DOCKER_RUN_FLAGS) $(TAG) bash

.PHONY: depend
depend: .mk.depend

.PHONY: build
build: .mk.build

.mk.build: requirements.txt setup.py Dockerfile $(shell find . -name '*.py')
	docker build -t $(TAG) .
	touch $@

.mk.depend: requirements.txt setup.py
	virtualenv -p python3.6 venv
	./venv/bin/pip install -r requirements.txt
	touch $@
