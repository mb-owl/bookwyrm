#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")/backwyrm"

# Activate virtual environment if it exists
if [ -d "../venv" ]; then
    source "../venv/bin/activate"
fi

# Create logs directory if it doesn't exist
mkdir -p ../logs

# Run the cleanup command and log output
echo "Running cleanup_deleted_books at $(date)" >> ../logs/cleanup.log
python manage.py cleanup_deleted_books >> ../logs/cleanup.log 2>&1

# Exit with the status of the command
exit $?
