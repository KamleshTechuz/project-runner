#!/bin/bash

# Start the backend app
cd /home/kamlesh/Documents/project-runner/back
source ~/.nvm/nvm.sh
nvm use
npm run start > /home/kamlesh/Documents/project-runner/back.log 2>&1 &
BACKEND_PID=$!

# Give some time for the backend to start
sleep 5

# Start the frontend app
cd /home/kamlesh/Documents/project-runner/front
source ~/.nvm/nvm.sh
nvm use
npm run dev > /home/kamlesh/Documents/project-runner/front.log 2>&1 &
FRONTEND_PID=$!

# Wait for both processes to finish
wait $BACKEND_PID
wait $FRONTEND_PID
