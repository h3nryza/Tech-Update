#!/usr/bin/env bash
set -euo pipefail

# Deploy the Tech Update Lambda function via AWS SAM.
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - AWS SAM CLI installed (brew install aws-sam-cli)
#   - GitHub PAT with repo write access
#
# Usage:
#   ./deploy.sh                    # Guided first-time deploy
#   ./deploy.sh --no-confirm       # Non-interactive re-deploy

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Tech Update Lambda Deploy ==="

# Step 1: Build
echo ""
echo "--- Building package ---"
bash "$SCRIPT_DIR/build.sh"

# Step 2: Validate template
echo ""
echo "--- Validating SAM template ---"
sam validate --template-file "$SCRIPT_DIR/template.yaml"

# Step 3: Deploy
echo ""
echo "--- Deploying ---"
if [[ "${1:-}" == "--no-confirm" ]]; then
  sam deploy \
    --template-file "$SCRIPT_DIR/template.yaml" \
    --stack-name tech-update-collector \
    --capabilities CAPABILITY_IAM \
    --no-confirm-changeset \
    --resolve-s3
else
  sam deploy \
    --template-file "$SCRIPT_DIR/template.yaml" \
    --stack-name tech-update-collector \
    --capabilities CAPABILITY_IAM \
    --guided \
    --resolve-s3
fi

echo ""
echo "=== Deploy complete ==="
echo ""
echo "Test the function:"
echo "  aws lambda invoke --function-name tech-update-collect /dev/stdout"
echo ""
echo "View logs:"
echo "  sam logs --name CollectFunction --stack-name tech-update-collector --tail"
