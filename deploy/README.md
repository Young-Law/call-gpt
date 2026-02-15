# Deployment notes

1. Build and push image using `deploy/Dockerfile`.
2. Replace `PROJECT_ID`, `APP_REPO`, `REDIS_HOST`, and hostnames in manifests.
3. Apply manifests in `deploy/k8s`.
4. Configure Twilio Voice webhook for your number to:
   - **URL:** `https://call-gpt.example.com/incoming`
   - **Method:** `HTTP POST`

The `/incoming` endpoint builds a TwiML response that upgrades to secure websocket (`wss://`) on the same ingress host.
