# Member 3 Submission Plan

## Owner
- Member: member3
- Contributor Name: VaishnaviSutharshan13
- GitHub Username: VaishnaviSutharshan13
- Contributor Email: it23670716@my.sliit.lk
- Source Branch: feature/member3-incident-technician-flow
- Output Folder: member3

## Commit Attribution
- Commit Author: VaishnaviSutharshan13
- Commit Email: it23670716@my.sliit.lk
- Suggested Commit Message: docs(member3): add contributor ownership and submission plan details

## Step-by-Step Plan
1. Move to project root.
2. Confirm branch exists locally or in origin.
3. Ensure split script is executable.
4. Run split script once for all members.
5. Validate member3 folder has backend and frontend.
6. Validate cleanup: no .git, node_modules, target, dist, build.
7. Install dependencies and run backend/frontend to confirm independent execution.
8. Zip member3 folder for submission.

## Project Allocation (Current Phase)
- Member 3 Share: 25%
- Combined Share (Member 1 + Member 2 + Member 3): 75%
- Pending Share for Member 4: 25%

## Commands
```bash
cd /home/senzmatepc7/Desktop/IT3030-paf-2026-smart-campus-group04

git branch --list "feature/member3-incident-technician-flow"
git branch -r --list "origin/feature/member3-incident-technician-flow"

chmod +x split_project_per_member.sh
./split_project_per_member.sh --output ../submission_split --with-readme

ls -la ../submission_split/member3
ls -la ../submission_split/member3/backend
ls -la ../submission_split/member3/frontend

find ../submission_split/member3 -type d \( -name .git -o -name node_modules -o -name target -o -name dist -o -name build \)

cd ../submission_split/member3/backend
./mvnw spring-boot:run

cd ../submission_split/member3/frontend
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
