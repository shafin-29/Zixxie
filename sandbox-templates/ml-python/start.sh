#!/bin/bash

# ML Python Sandbox startup script
# Creates output directories and signals sandbox is ready

mkdir -p /home/user/outputs/model
mkdir -p /home/user/outputs/plots
mkdir -p /home/user/outputs/data
mkdir -p /home/user/outputs/reports

echo "ML Python sandbox ready"
echo "Python: $(python --version)"
echo "Working directory: $(pwd)"

# Keep the sandbox alive
tail -f /dev/null
