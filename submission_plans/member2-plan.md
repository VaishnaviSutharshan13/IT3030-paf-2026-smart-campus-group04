# Member 2 Submission Plan

## Owner
- Member: member2
- Contributor Name: Biranavy Raveendran
- GitHub Username: Biranavy Raveendran
- Contributor Email: raveendranshanthy@gmail.com
- Source Branch: feature/member2-booking-conflict-logic
- Output Folder: member2

## Commit Attribution
- Commit Author: Biranavy Raveendran
- Commit Email: raveendranshanthy@gmail.com
- Suggested Commit Message: docs(member2): add contributor ownership and submission plan details

## Step-by-Step Plan
1. Move to project root.
2. Confirm branch exists locally or in origin.
3. Ensure split script is executable.
4. Run split script once for all members.
5. Validate member2 folder has backend and frontend.
6. Validate cleanup: no .git, node_modules, target, dist, build.
7. Install dependencies and run backend/frontend to confirm independent execution.
8. Zip member2 folder for submission.

## Commands
```bash
cd /home/senzmatepc7/Desktop/IT3030-paf-2026-smart-campus-group04

git branch --list "feature/member2-booking-conflict-logic"
git branch -r --list "origin/feature/member2-booking-conflict-logic"

chmod +x split_project_per_member.sh
./split_project_per_member.sh --output ../submission_split --with-readme

ls -la ../submission_split/member2
ls -la ../submission_split/member2/backend
ls -la ../submission_split/member2/frontend

find ../submission_split/member2 -type d \( -name .git -o -name node_modules -o -name target -o -name dist -o -name build \)

cd ../submission_split/member2/backend
./mvnw spring-boot:run

cd ../submission_split/member2/frontend
npm install
npm run dev
```

## Done Checklist
- [ ] Correct branch content copied
- [ ] backend and frontend both present
- [ ] Unnecessary folders removed
- [ ] Backend starts successfully
- [ ] Frontend starts successfully
- [ ] Submission zip created
