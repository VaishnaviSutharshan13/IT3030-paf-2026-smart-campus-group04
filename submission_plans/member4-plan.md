# Member 4 Submission Plan

## Owner
- Member: member4
- Source Branch: feature/member4-auth-notification-rbac
- Output Folder: member4

## Step-by-Step Plan
1. Move to project root.
2. Confirm branch exists locally or in origin.
3. Ensure split script is executable.
4. Run split script once for all members.
5. Validate member4 folder has backend and frontend.
6. Validate cleanup: no .git, node_modules, target, dist, build.
7. Install dependencies and run backend/frontend to confirm independent execution.
8. Zip member4 folder for submission.

## Commands
```bash
cd /home/senzmatepc7/Desktop/IT3030-paf-2026-smart-campus-group04

git branch --list "feature/member4-auth-notification-rbac"
git branch -r --list "origin/feature/member4-auth-notification-rbac"

chmod +x split_project_per_member.sh
./split_project_per_member.sh --output ../submission_split --with-readme

ls -la ../submission_split/member4
ls -la ../submission_split/member4/backend
ls -la ../submission_split/member4/frontend

find ../submission_split/member4 -type d \( -name .git -o -name node_modules -o -name target -o -name dist -o -name build \)

cd ../submission_split/member4/backend
./mvnw spring-boot:run

cd ../submission_split/member4/frontend
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
