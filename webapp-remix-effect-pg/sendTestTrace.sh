#!/bin/bash

# Get current time in nanoseconds
NOW=$(($(date +%s)*1000000000))
END=$(($(date +%s)*1000000000 + 1000000000))
CHILD_END=$(($(date +%s)*1000000000 + 900000000))

curl -X POST http://localhost:4318/v1/traces \
-H 'Content-Type: application/json' \
-d '{
  "resourceSpans": [{
    "resource": {
      "attributes": [{
        "key": "service.name",
        "value": { "stringValue": "test-service" }
      }]
    },
    "scopeSpans": [{
      "scope": {
        "name": "test-instrumentation"
      },
      "spans": [{
        "traceId": "1234567890abcdef1234567890abcdef",
        "spanId": "1234567890abcdef",
        "name": "parent-operation",
        "kind": 1,
        "startTimeUnixNano": "'$NOW'",
        "endTimeUnixNano": "'$END'",
        "attributes": [{
          "key": "test.attribute",
          "value": { "stringValue": "test-value" }
        }]
      },
      {
        "traceId": "1234567890abcdef1234567890abcdef",
        "spanId": "abcdef1234567890",
        "parentSpanId": "1234567890abcdef",
        "name": "child-operation",
        "kind": 1,
        "startTimeUnixNano": "'$NOW'",
        "endTimeUnixNano": "'$CHILD_END'",
        "attributes": [{
          "key": "child.attribute",
          "value": { "stringValue": "child-value" }
        }]
      }]
    }]
  }]
}'