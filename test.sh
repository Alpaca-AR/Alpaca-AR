#!/bin/bash

host=127.0.0.1:8080

store-get-namespaces() {
	curl -s -X GET $host/store/ | python3 -m json.tool
}

store-add-entry() {
	curl -s -X POST $host/store/$namespace/ 

"$@"
