#!/bin/bash

# This script fixes the GitHub push issue by removing the .next folder from git
# and then commits and pushes the changes

echo "Removing .next folder from git tracking..."
git rm -r --cached .next

echo "Adding .gitignore changes..."
git add .gitignore

echo "Committing changes..."
git commit -m "Fix: Remove .next build folder from git and update .gitignore"

echo "Pushing to GitHub..."
git push origin main

echo "Done! Your code is now on GitHub."
