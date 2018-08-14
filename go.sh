#!/usr/bin/env bash

perf_tag=alpaca_perf

perf-build() {
	docker build perf -t $perf_tag
}

perf-run() {
	docker run --rm --pid=host $perf_tag "$@"
}

"$@"
