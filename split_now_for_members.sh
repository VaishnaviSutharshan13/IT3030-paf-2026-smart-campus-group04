#!/usr/bin/env bash
set -Eeuo pipefail

REPO="/home/senzmatepc7/Desktop/IT3030-paf-2026-smart-campus-group04"
OUT_BASE="/home/senzmatepc7/Desktop"
OUT_DIR="$OUT_BASE/submission_split_$(date +%Y%m%d_%H%M%S)"

cd "$REPO"
mkdir -p "$OUT_DIR"

ORIG_BRANCH="$(git branch --show-current || true)"
ORIG_COMMIT="$(git rev-parse --verify HEAD)"

restore_ref() {
  if [[ -n "$ORIG_BRANCH" ]]; then
    git switch -q "$ORIG_BRANCH" >/dev/null 2>&1 || true
  else
    git switch -q --detach "$ORIG_COMMIT" >/dev/null 2>&1 || true
  fi
}
trap restore_ref EXIT

declare -A MAP=(
  [member1]="origin/feature/member1-facilities-resource-management"
  [member2]="origin/feature/member2-booking-conflict-logic"
  [member3]="origin/feature/member3-incident-technician-flow"
  [member4]="origin/feature/member4-auth-notification-rbac"
)

for m in member1 member2 member3 member4; do
  ref="${MAP[$m]}"
  dest="$OUT_DIR/$m"

  git rev-parse --verify "$ref" >/dev/null 2>&1

  git switch -q --detach "$ref"
  mkdir -p "$dest"

  rsync -a --delete \
    --exclude '.git/' --exclude '**/.git/' \
    --exclude 'node_modules/' --exclude '**/node_modules/' \
    --exclude 'target/' --exclude '**/target/' \
    --exclude 'dist/' --exclude '**/dist/' \
    --exclude 'build/' --exclude '**/build/' \
    ./ "$dest/"

  # Cleanup fallback in case any ignored folder still exists
  find "$dest" -type d \( -name .git -o -name node_modules -o -name target -o -name dist -o -name build \) -prune -exec rm -rf {} +

  case "$m" in
    member1)
      SCOPE='Facilities catalogue + resource management endpoints'
      ;;
    member2)
      SCOPE='Booking workflow + conflict checking'
      ;;
    member3)
      SCOPE='Incident tickets + attachments + technician updates'
      ;;
    member4)
      SCOPE='Notifications + role management + OAuth integration improvements'
      ;;
  esac

  cat > "$dest/README_MEMBER.md" <<EOF
# ${m} Submission Bundle

## Source Branch
${ref#origin/}

## Allocated Scope (Important)
${SCOPE}

## Included
- backend/
- frontend/

## Excluded
- .git
- node_modules
- target
- dist/build

## Run Backend
cd backend
./mvnw spring-boot:run

## Run Frontend
cd frontend
npm install
npm run dev
EOF

  [[ -d "$dest/backend" ]] || { echo "Missing backend in $dest"; exit 1; }
  [[ -d "$dest/frontend" ]] || { echo "Missing frontend in $dest"; exit 1; }

done

echo "OUTPUT_DIR=$OUT_DIR"
for m in member1 member2 member3 member4; do
  cnt="$(find "$OUT_DIR/$m" -type d \( -name .git -o -name node_modules -o -name target -o -name dist -o -name build \) | wc -l)"
  echo "$m unwanted_dir_count=$cnt"
done
