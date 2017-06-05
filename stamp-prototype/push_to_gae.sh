#!/bin/bash

# Fail the push_to_gae script if any subsequent commands fail.
set -e

# Make sure we're in the stamp-prototype/ directory.
cd "`git rev-parse --show-toplevel`/stamp-prototype"

# Build AMP and extensions.
gulp dist

# Copy relevant files to the stamp-prototype/www/ directory.
cp -v ../dist/v0.css ./www/v0.css
cp -v ../dist/v0.js ./www/v0.js
cp -v ../dist/v0.js.map ./www/v0.js.map
cp -v ../dist/v0/amp-story-0.1.css ./www/v0/amp-story-0.1.css
cp -v ../dist/v0/amp-story-0.1.js ./www/v0/amp-story-0.1.js
cp -v ../dist/v0/amp-story-0.1.js.map ./www/v0/amp-story-0.1.js.map
cp -v ../dist/v0/amp-story-latest.js ./www/v0/amp-story-latest.js

# Deploy the app to App Engine.
gcloud app deploy app.yaml --no-promote --quiet --project=stamp-prototype