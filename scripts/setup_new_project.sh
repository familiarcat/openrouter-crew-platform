#!/bin/bash

#
# setup_new_project.sh
# A script to automate the creation of a new project, budget, and initial sprint
# using the 'crew' CLI, based on user-provided arguments.
#

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Usage Function ---
usage() {
    echo "Usage: $0 \"<Project Name>\" <Budget> \"<Sprint Name>\" \"<Sprint Goal>\" [<Sprint Duration>]"
    echo ""
    echo "Arguments:"
    echo "  <Project Name>      The name of the new project (use quotes for names with spaces)."
    echo "  <Budget>            The initial budget in USD (e.g., 500.00)."
    echo "  <Sprint Name>       The name for the first sprint (e.g., 'Sprint 1: Foundation')."
    echo "  <Sprint Goal>       The primary goal for the first sprint."
    echo "  <Sprint Duration>   (Optional) The duration of the sprint in days. Defaults to 14."
    echo ""
    echo "Example:"
    echo "  $0 \"AI Dashboard\" 500.00 \"Sprint 1: Core Setup\" \"Build the basic UI and auth\" 14"
    exit 1
}

# --- Argument Validation ---
if [ "$#" -lt 4 ] || [ "$#" -gt 5 ]; then
    usage
fi

# --- Variable Assignment ---
PROJECT_NAME="$1"
BUDGET="$2"
SPRINT_NAME="$3"
SPRINT_GOAL="$4"
SPRINT_DURATION="${5:-14}" # Default to 14 days if the 5th argument is not provided

# --- Main Execution ---
echo "🚀 Starting new project setup..."
echo "---------------------------------"
echo "  Project Name:    $PROJECT_NAME"
echo "  Budget:          \$$BUDGET"
echo "  Sprint Name:     $SPRINT_NAME"
echo "  Sprint Goal:     '$SPRINT_GOAL'"
echo "  Sprint Duration: $SPRINT_DURATION days"
echo "---------------------------------"
echo ""

echo "STEP 1: Creating project '$PROJECT_NAME'..."
# Note: Using 'crew project create' as found in LOCAL_TESTING_SUMMARY.txt for a pure CLI workflow.
crew project create --name "$PROJECT_NAME"
echo "✅ Project created."
echo ""

echo "STEP 2: Setting budget for '$PROJECT_NAME' to \$$BUDGET..."
crew cost budget set "$PROJECT_NAME" "$BUDGET"
echo "✅ Budget set."
echo ""

echo "STEP 3: Creating sprint '$SPRINT_NAME'..."
crew project sprint "$SPRINT_NAME" --goal "$SPRINT_GOAL" --duration "$SPRINT_DURATION"
echo "✅ Sprint created."
echo ""

echo "🎉 Project setup complete for '$PROJECT_NAME'."
echo "Run 'crew project list' to see your new project."