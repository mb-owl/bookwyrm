#!/bin/bash

# Start Django server with binding to all interfaces
echo "Starting Django server on all network interfaces (0.0.0.0:8000)"
echo "This allows connections from all devices on your local network"
python manage.py runserver 0.0.0.0:8000
