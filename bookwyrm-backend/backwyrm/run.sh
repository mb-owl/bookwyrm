#!/bin/bash
# Run the Django server on all interfaces to allow network access
cd /Users/mb/workspace/bookwyrm/bookwyrm-backend/backwyrm
python manage.py runserver 0.0.0.0:8000
