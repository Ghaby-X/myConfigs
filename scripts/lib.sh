# Shared by the install scripts (source it; don't run it).
# Collects "what happened" lines and prints them as a summary block when the script
# ends — also when it stops early because of an error, so you always see how far it got.
#
#   source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"      # from scripts/
#   summary_trap "install.sh"                            # print on exit (any exit)
#   summary_add "packages" "12 installed, 30 already present"
#   summary_warn "3 wallpapers failed"                   # shown under "attention"

STARTED_AT=$SECONDS
_SUMMARY_KEYS=()
_SUMMARY_VALS=()
_SUMMARY_WARNS=()

summary_add() { _SUMMARY_KEYS+=("$1"); _SUMMARY_VALS+=("$2"); }
summary_warn() { _SUMMARY_WARNS+=("$1"); }

summary_print() { # title exit-code
  local title="$1" rc="${2:-0}" i elapsed=$((SECONDS - STARTED_AT))
  echo
  echo "════════ $title — summary ════════"
  for i in "${!_SUMMARY_KEYS[@]}"; do
    printf '  %-16s %s\n' "${_SUMMARY_KEYS[$i]}" "${_SUMMARY_VALS[$i]}"
  done
  printf '  %-16s %dm %02ds\n' "time" $((elapsed / 60)) $((elapsed % 60))
  if [[ ${#_SUMMARY_WARNS[@]} -gt 0 ]]; then
    echo "  attention:"
    printf '    - %s\n' "${_SUMMARY_WARNS[@]}"
  fi
  if [[ "$rc" -ne 0 ]]; then
    echo "  result           STOPPED EARLY (exit code $rc) — everything above is what was done before that"
  elif [[ ${#_SUMMARY_WARNS[@]} -gt 0 ]]; then
    echo "  result           finished, with the items above to look at"
  else
    echo "  result           finished cleanly"
  fi
  echo "════════════════════════════════════"
}

# print the summary whenever the script ends
summary_trap() { _SUMMARY_TITLE="$1"; trap '_rc=$?; summary_print "$_SUMMARY_TITLE" "$_rc"' EXIT; }
