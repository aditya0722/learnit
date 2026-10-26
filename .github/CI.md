# Continuous integration and deployment

Pull requests targeting `master` run the **CI** workflow. Every push to `master` runs the same reusable workflow through **Deploy → CI**. The CI workflow can also be run manually from GitHub Actions.

The two jobs run independently:

- **Frontend build and tests:** installs the exact `client/package-lock.json` dependencies with `npm ci`, runs all frontend unit tests, and runs a production Next.js build including TypeScript checks.
- **Backend unit tests:** installs the exact server dependencies, checks JavaScript syntax, and tests submission storage, marks, skipped questions, redo history, and student ownership using the in-memory test store.

CI uses Node.js 24 because the frontend tests import TypeScript directly. Dependencies are cached separately for the client and server. No production database, EmailJS credentials, or SSH secrets are passed to CI. EmailJS tests mock requests and do not send mail.

After both jobs succeed on a push to `master`, the existing SSH deployment runs. It deploys the exact tested commit and skips older runs if `master` has advanced. Deployments are serialized so Docker builds do not overlap. A failed or cancelled CI job prevents deployment.

For pull requests, configure the two named job checks as required checks in the repository's branch protection settings if merges should also be blocked. The workflow itself does not change repository settings.

## Run the checks locally

```sh
cd client
npm ci
npm test
npm run build
```

```sh
cd server
npm ci
npm run test:unit
```

## Current scope

Repository-wide ESLint and the older `server/test/api.test.js` integration suite are not CI gates yet. The existing lint baseline contains errors, and the API suite uses unauthenticated requests and older route/payload expectations that no longer match the application. `npm test` in `server` still runs the complete suite; it has not been changed to hide those failures. Update its authenticated fixtures and isolate any required database setup before adding it as a gate. No failing check in this workflow uses `continue-on-error`.

The mobile app is separate local work and is not part of this web-app pipeline.

References: [Reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows), [Node.js setup and npm caching](https://github.com/actions/setup-node).
