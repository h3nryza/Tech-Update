#!/bin/bash
# ============================================================
# Tech Update — Cron Manager
# Manage the daily news collection schedule in plain English.
# Works on macOS (launchctl) and Linux (crontab).
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PLIST_NAME="com.h3nryza.tech-update"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
CRON_MARKER="# tech-update-collect"

# Colours
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Tech Update — Schedule Manager       ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
  echo ""
}

detect_os() {
  case "$(uname -s)" in
    Darwin*) echo "mac" ;;
    Linux*)  echo "linux" ;;
    *)       echo "unknown" ;;
  esac
}

# ---- macOS (launchctl) ----

mac_create_plist() {
  local hour=$1
  local minute=$2

  cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_NAME}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>${SCRIPT_DIR}/collect.js</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${SCRIPT_DIR}</string>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${hour}</integer>
    <key>Minute</key>
    <integer>${minute}</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${PROJECT_DIR}/logs/collect.log</string>
  <key>StandardErrorPath</key>
  <string>${PROJECT_DIR}/logs/collect-error.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
PLIST

  mkdir -p "$PROJECT_DIR/logs"
}

mac_install() {
  local hour=$1
  local minute=$2

  # Unload existing if present
  if launchctl list 2>/dev/null | grep -q "$PLIST_NAME"; then
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
  fi

  mac_create_plist "$hour" "$minute"
  launchctl load "$PLIST_PATH"

  echo -e "${GREEN}Scheduled!${NC} Collection will run daily at ${YELLOW}$(printf '%02d:%02d' "$hour" "$minute")${NC}"
  echo -e "  Plist: $PLIST_PATH"
  echo -e "  Logs:  $PROJECT_DIR/logs/"
}

mac_remove() {
  if [ -f "$PLIST_PATH" ]; then
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    rm -f "$PLIST_PATH"
    echo -e "${GREEN}Removed.${NC} The daily collection schedule has been deleted."
  else
    echo -e "${YELLOW}No schedule found.${NC} Nothing to remove."
  fi
}

mac_status() {
  if launchctl list 2>/dev/null | grep -q "$PLIST_NAME"; then
    echo -e "${GREEN}Active.${NC} The collection is currently scheduled."
    if [ -f "$PLIST_PATH" ]; then
      local hour=$(plutil -extract StartCalendarInterval.Hour raw "$PLIST_PATH" 2>/dev/null || echo "?")
      local minute=$(plutil -extract StartCalendarInterval.Minute raw "$PLIST_PATH" 2>/dev/null || echo "?")
      echo -e "  Runs daily at: ${YELLOW}$(printf '%02d:%02d' "$hour" "$minute")${NC}"
    fi
  else
    echo -e "${RED}Not active.${NC} No schedule is set."
  fi
}

# ---- Linux (crontab) ----

linux_install() {
  local hour=$1
  local minute=$2
  local node_path
  node_path=$(which node)

  mkdir -p "$PROJECT_DIR/logs"

  # Remove old entry if present
  crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab - 2>/dev/null || true

  # Add new entry
  (crontab -l 2>/dev/null; echo "${minute} ${hour} * * * cd ${SCRIPT_DIR} && ${node_path} collect.js >> ${PROJECT_DIR}/logs/collect.log 2>&1 ${CRON_MARKER}") | crontab -

  echo -e "${GREEN}Scheduled!${NC} Collection will run daily at ${YELLOW}$(printf '%02d:%02d' "$hour" "$minute")${NC}"
  echo -e "  Logs: $PROJECT_DIR/logs/"
}

linux_remove() {
  if crontab -l 2>/dev/null | grep -q "$CRON_MARKER"; then
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | crontab -
    echo -e "${GREEN}Removed.${NC} The daily collection schedule has been deleted."
  else
    echo -e "${YELLOW}No schedule found.${NC} Nothing to remove."
  fi
}

linux_status() {
  if crontab -l 2>/dev/null | grep -q "$CRON_MARKER"; then
    echo -e "${GREEN}Active.${NC} The collection is currently scheduled."
    local entry
    entry=$(crontab -l 2>/dev/null | grep "$CRON_MARKER")
    local min hour
    min=$(echo "$entry" | awk '{print $1}')
    hour=$(echo "$entry" | awk '{print $2}')
    echo -e "  Runs daily at: ${YELLOW}$(printf '%02d:%02d' "$hour" "$min")${NC}"
  else
    echo -e "${RED}Not active.${NC} No schedule is set."
  fi
}

# ---- Parse human-friendly time ----

parse_time() {
  local input="$1"

  # Handle "8am", "8 am", "08:00", "8:30am", "14:00", "2pm", "2:30 pm"
  input=$(echo "$input" | tr '[:upper:]' '[:lower:]' | tr -d ' ')

  local hour=0
  local minute=0

  if echo "$input" | grep -qE '^[0-9]{1,2}:[0-9]{2}(am|pm)?$'; then
    hour=$(echo "$input" | cut -d: -f1)
    minute=$(echo "$input" | cut -d: -f2 | sed 's/[^0-9]//g')
    if echo "$input" | grep -q 'pm' && [ "$hour" -lt 12 ]; then
      hour=$((hour + 12))
    elif echo "$input" | grep -q 'am' && [ "$hour" -eq 12 ]; then
      hour=0
    fi
  elif echo "$input" | grep -qE '^[0-9]{1,2}(am|pm)$'; then
    hour=$(echo "$input" | sed 's/[^0-9]//g')
    if echo "$input" | grep -q 'pm' && [ "$hour" -lt 12 ]; then
      hour=$((hour + 12))
    elif echo "$input" | grep -q 'am' && [ "$hour" -eq 12 ]; then
      hour=0
    fi
    minute=0
  elif echo "$input" | grep -qE '^[0-9]{1,2}$'; then
    hour="$input"
    minute=0
  else
    echo "-1 -1"
    return
  fi

  if [ "$hour" -lt 0 ] || [ "$hour" -gt 23 ] || [ "$minute" -lt 0 ] || [ "$minute" -gt 59 ]; then
    echo "-1 -1"
    return
  fi

  echo "$hour $minute"
}

# ---- Run now ----

run_now() {
  echo -e "${BLUE}Running collection now...${NC}"
  cd "$SCRIPT_DIR"
  node collect.js && node build.js
  echo -e "${GREEN}Done!${NC} Data has been updated."
}

# ---- Main menu ----

show_help() {
  print_header
  echo "Usage: $(basename "$0") <command> [options]"
  echo ""
  echo "Commands:"
  echo "  ${GREEN}schedule${NC} <time>     Set daily collection time"
  echo "                      Examples: schedule 8am"
  echo "                                schedule 14:30"
  echo "                                schedule \"2:30 PM\""
  echo ""
  echo "  ${GREEN}remove${NC}              Remove the daily schedule"
  echo ""
  echo "  ${GREEN}status${NC}              Check if a schedule is active"
  echo ""
  echo "  ${GREEN}run${NC}                 Run collection right now"
  echo ""
  echo "  ${GREEN}help${NC}                Show this help"
  echo ""
  echo "Examples:"
  echo "  ./cron-manager.sh schedule 8am        # Every day at 8:00 AM"
  echo "  ./cron-manager.sh schedule 6:30am     # Every day at 6:30 AM"
  echo "  ./cron-manager.sh schedule 14:00      # Every day at 2:00 PM"
  echo "  ./cron-manager.sh remove              # Stop the schedule"
  echo "  ./cron-manager.sh status              # Is it running?"
  echo "  ./cron-manager.sh run                 # Collect now"
  echo ""
}

main() {
  local os
  os=$(detect_os)

  if [ "$os" = "unknown" ]; then
    echo -e "${RED}Error:${NC} Unsupported operating system. Use macOS or Linux."
    exit 1
  fi

  local cmd="${1:-help}"

  case "$cmd" in
    schedule|set|add)
      if [ -z "${2:-}" ]; then
        echo -e "${RED}Error:${NC} Please provide a time."
        echo "  Example: $(basename "$0") schedule 8am"
        exit 1
      fi
      local parsed
      parsed=$(parse_time "$2")
      local hour minute
      hour=$(echo "$parsed" | awk '{print $1}')
      minute=$(echo "$parsed" | awk '{print $2}')

      if [ "$hour" = "-1" ]; then
        echo -e "${RED}Error:${NC} Could not understand '${2}' as a time."
        echo "  Try formats like: 8am, 14:30, 2:30pm, 06:00"
        exit 1
      fi

      print_header
      if [ "$os" = "mac" ]; then
        mac_install "$hour" "$minute"
      else
        linux_install "$hour" "$minute"
      fi
      ;;

    remove|delete|uninstall|stop)
      print_header
      if [ "$os" = "mac" ]; then
        mac_remove
      else
        linux_remove
      fi
      ;;

    status|check)
      print_header
      if [ "$os" = "mac" ]; then
        mac_status
      else
        linux_status
      fi
      ;;

    run|now|collect)
      print_header
      run_now
      ;;

    help|--help|-h)
      show_help
      ;;

    *)
      echo -e "${RED}Unknown command:${NC} $cmd"
      show_help
      exit 1
      ;;
  esac
}

main "$@"
