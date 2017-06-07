# STAMP Prototype #

## Deployment ##

### One-time Setup ###

1. Download the Google Cloud SDK from https://cloud.google.com/sdk/docs/

To get the gcloud command, install the latest version of the Google Cloud SDK
from https://cloud.google.com/sdk/docs/.  (Any steps listed as "optional" may be
omitted).

2. Run `gcloud auth login`.

This will bring up a new browser window asking you to authenticate with your
Google account.  Logging in will give the Google Cloud SDK the ability to deploy
the application on your behalf, and will be remembered for future sessions.  Use
a Google account whitelisted for deploying to stamp-prototype.appspot.com.  If
your account is not whitelisted, contact @newmuis.

### Build and Deploy ####

To cut a new build and deploy to App Engine, simply run `./push_to_gae.sh` from
this directory.