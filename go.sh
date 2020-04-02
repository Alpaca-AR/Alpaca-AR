#!/usr/bin/env bash

perf_tag=alpaca_perf
youtube_tag=alpaca_youtube:latest

perf-build() {
	docker build perf -t $perf_tag
}

perf-run() {
	docker run --rm --pid=host $perf_tag "$@"
}

youtube-build() {
	docker build -t $youtube_tag youtube
}

youtube-run() {
	docker run -it --rm -p 8806:8806 -v $PWD/youtube/data:/app/data $youtube_tag "$@"
}

"$@"
