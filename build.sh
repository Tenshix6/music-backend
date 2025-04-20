#!/bin/bash

# Install Python 3 and pip
apt-get update
apt-get install -y python3 python3-pip

# Install yt-dlp using pip
pip3 install yt-dlp
