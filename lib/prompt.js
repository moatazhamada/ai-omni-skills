import readline from 'node:readline';

export async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function executeWithConsent(actionFn, flags) {
  // Explicit dry-run always wins over --yes so users can preview safely.
  if (flags.dryRun) {
    return await actionFn(flags);
  }

  // If user explicitly passed --yes or -y, skip prompt and run for real.
  if (flags.yes) {
    return await actionFn({ ...flags, dryRun: false });
  }

  console.log('\n--- PLANNED ACTIONS (DRY RUN) ---');
  await actionFn({ ...flags, dryRun: true });
  console.log('---------------------------------\n');

  const answer = await promptUser('These files will be modified. Proceed? [Y/n]: ');

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer === '') {
    console.log('\nExecuting changes...\n');
    return await actionFn({ ...flags, dryRun: false });
  } else {
    console.log('\nAborted. No changes were made.');
    process.exit(0);
  }
}
