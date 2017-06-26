#!/bin/bash

# Fail the push_to_gae script if any subsequent commands fail.
set -e

# Make sure we're in the stamp-prototype/ directory.
cd "`git rev-parse --show-toplevel`/stamp-prototype"

# Build AMP and extensions.
gulp dist

# Copy runtime and extension files to the stamp-prototype/www/ directory.
cp -a -v ../dist/* ./www

# Copy examples to the stamp-prototype/www/ directory.
cp -a -v ../examples/stamp/* ./www

# Replace 'cdn.ampproject.org' with 'stamp-prototype.appspot.com' in examples.
find . -name '*.html' -exec sed -i '' -e 's/cdn.ampproject.org/stamp-prototype.appspot.com/g' {} \;

# Deploy the app to App Engine.
gcloud app deploy app.yaml --no-promote --quiet --project=stamp-prototype