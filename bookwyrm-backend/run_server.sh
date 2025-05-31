#!/bin/bash

# Start Django server with settings that allow external connections
echo "Starting Django server accessible from all network interfaces..."
echo "Your server will be available at: http://192.168.0.57:8000"
echo "iPhone 16 Pro can connect via: http://192.168.0.57:8000"
echo "----------------------------------------"

# Run the Django development server on all interfaces (0.0.0.0)
python manage.py runserver 0.0.0.0:8000
