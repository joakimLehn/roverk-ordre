#!/usr/bin/env bash
# Oppretter «Redigerbar bestilling» som GitHub-issues: én forelder
# (tracking, uten task-label) og to sub-issues med label
# `agent-orchestrator`, lenket lineært (#2 avhenger av #1).
#
# Idempotent: eksisterende issues med samme tittel gjenbrukes.
#
# Forutsetning:
#   gh auth switch --user joakimLehn

set -euo pipefail

REPO="joakimLehn/roverk-ordre"
LABEL="agent-orchestrator"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TITLE_EPIC="Redigerbar bestilling – endre config/kledning i etterkant"
TITLE_1="feat: redigerbar bestilling – domenelogikk og datalag"
TITLE_2="feat: redigerbar bestilling – skjema på ordredetaljsiden"

issue_id() {
  gh api "repos/$REPO/issues/$1" --jq '.id'
}

# Finn eksisterende issue-nummer på eksakt tittel, ellers tom streng.
find_issue() {
  gh issue list --repo "$REPO" --search "in:title \"$1\"" --state all \
    --json number,title --jq ".[] | select(.title == \"$1\") | .number" | head -1
}

# Opprett issue om den ikke finnes; skriv nummeret til stdout.
ensure_issue() { # $1=tittel $2=bodyfil $3=label (tom = ingen)
  local num
  num="$(find_issue "$1")"
  if [ -n "$num" ]; then
    echo "finnes allerede: #$num $1" >&2
    echo "$num"
    return
  fi
  local args=(--repo "$REPO" --title "$1" --body-file "$2")
  [ -n "$3" ] && args+=(--label "$3")
  local url
  url="$(gh issue create "${args[@]}")"
  echo "opprettet: $url" >&2
  echo "${url##*/}"
}

echo "== Sørger for at labelen finnes =="
gh label create "$LABEL" --repo "$REPO" \
  --description "Plukkes opp av agent-orchestrator" --color 1D76DB \
  2>/dev/null || echo "label $LABEL finnes fra før"

echo "== Forelder (tracking, uten label) =="
parent_num="$(ensure_issue "$TITLE_EPIC" "$HERE/epic-body.md" "")"
parent_id="$(issue_id "$parent_num")"

echo "== Issue 1: domenelogikk og datalag =="
issue1_num="$(ensure_issue "$TITLE_1" "$HERE/issue-1-domene-og-datalag.md" "$LABEL")"
issue1_id="$(issue_id "$issue1_num")"

echo "== Issue 2: UI på ordredetaljsiden =="
issue2_num="$(ensure_issue "$TITLE_2" "$HERE/issue-2-ui-redigering.md" "$LABEL")"
issue2_id="$(issue_id "$issue2_num")"

echo
echo "== Lenker sub-issues under forelderen =="
for id in "$issue1_id" "$issue2_id"; do
  gh api "repos/$REPO/issues/$parent_num/sub_issues" -X POST -F sub_issue_id="$id" \
    > /dev/null 2>&1 || true # 422 når lenken finnes fra før
done
echo "lenket #$issue1_num og #$issue2_num under #$parent_num"

echo
echo "== blocked_by-avhengighet =="
gh api "repos/$REPO/issues/$issue2_num/dependencies/blocked_by" -F issue_id="$issue1_id" \
  > /dev/null 2>&1 || true # 422 når avhengigheten finnes fra før
echo "issue #$issue2_num blokkeres av #$issue1_num"

echo
echo "Ferdig."
echo "Forelder: #$parent_num"
echo "Kjede:    #$issue1_num -> #$issue2_num"
