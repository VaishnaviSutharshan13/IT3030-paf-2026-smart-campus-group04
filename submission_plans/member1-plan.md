# Member 1 Submission Plan

## Owner
- Member: member1
- Contributor Name: Gowsikan
- GitHub Username: Gowsikan27
- Source Branch: feature/member1-facilities-resource-management
- Output Folder: member1

## Commit Attribution
- Commit Author: Gowsikan27
- Suggested Commit Message: docs(member1): add contribution ownership and submission plan details

## Project Allocation (Current Phase)
- Member 1 Share: 25%
- Combined Share (Member 1 + Member 2 + Member 3): 75%
- Pending Share for Member 4: 25%

## Step-by-Step Plan
1. Move to project root.
2. Confirm branch exists locally or in origin.
3. Create split script file (if not already created).
4. Run split script once for all members.
5. Validate member1 folder has backend and frontend.
6. Validate cleanup: no .git, node_modules, target, dist, build.
7. Install dependencies and run backend/frontend to confirm independent execution.
8. Zip member1 folder for submission.

## Commands
```bash
cd /home/senzmatepc7/Desktop/IT3030-paf-2026-smart-campus-group04

git branch --list "feature/member1-facilities-resource-management"
git branch -r --list "origin/feature/member1-facilities-resource-management"

chmod +x split_project_per_member.sh
./split_project_per_member.sh --output ../submission_split --with-readme

ls -la ../submission_split/member1
ls -la ../submission_split/member1/backend
ls -la ../submission_split/member1/frontend

find ../submission_split/member1 -type d \( -name .git -o -name node_modules -o -name target -o -name dist -o -name build \)

cd ../submission_split/member1/backend
./mvnw spring-boot:run

cd ../submission_split/member1/frontend
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
