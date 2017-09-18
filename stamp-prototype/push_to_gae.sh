#!/bin/bash

# Fail the push_to_gae script if any subsequent commands fail.
set -e

# Make sure we're in the stamp-prototype/ directory.
cd "`git rev-parse --show-toplevel`/stamp-prototype"

# Build AMP and extensions.
gulp dist

# Copy files to the stamp-prototype/www/ directory.
cp -a -v ../dist/* ./www

# Deploy the app to App Engine.
gcloud app deploy app.yaml --no-promote --quiet --project=stamp-prototype