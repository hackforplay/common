#!/bin/bash

set -e

echo $GCLOUD_SERVICE_KEY | base64 --decode -i > ${HOME}/gcloud-service-key.json
gcloud auth activate-service-account --key-file ${HOME}/gcloud-service-key.json

PATCH_VERSION=${TRAVIS_TAG:1}
MINOR_VERSION=${PATCH_VERSION%.*}
gsutil cp -r dist gs://cdn.hackforplay.xyz/common/${PATCH_VERSION}
gsutil cp -r gs://cdn.hackforplay.xyz/common/${PATCH_VERSION} gs://cdn.hackforplay.xyz/common/${MINOR_VERSION}
