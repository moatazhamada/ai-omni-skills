export const DENYLIST = [
  /acme-corp|example-project|demo-company|sample-client|test-enterprise/i,
  /\b[A-Z]{2,}-\d+\b/,
  /sk-[A-Za-z0-9]{12,}|ghp_[A-Za-z0-9]+|AKIA[0-9A-Z]{12}|-----BEGIN/,
  /(internal|corp|vpn)\./i,
];

export function scanSkillText(text) {
  const hits = [];
  for (const re of DENYLIST) {
    const m = text.match(re);
    if (m) hits.push(`${re.toString()} matched "${m[0]}"`);
  }
  return hits;
}
