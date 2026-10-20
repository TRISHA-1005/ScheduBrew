# ScheduBrew Account Registration Patch

This is a small overlay patch for your existing ScheduBrew project. It contains only account registration related source files and does not include `app/twitter-image.png`, other image assets, package files, environment files, or the rest of the application.

## Apply the patch

1. Keep using your current project folder. Back it up first.
2. Extract this ZIP into the existing project root, where `package.json` is located. Allow the listed files to merge and overwrite matching files.
3. Do not replace your entire project folder with this ZIP.
4. Run `node scripts/check-account-registration.mjs`.
5. Stop any running Next.js development server with Ctrl+C, then run `npm run build`.

## About the `twitter-image.png` error

This patch deliberately does not include or overwrite `app/twitter-image.png`. The reported Windows `os error 32` means the existing image file was locked by another process. If that error continues, close image previews/editors, stop other Next.js/node processes, restart VS Code if needed, and retry the build. The patch alone cannot release an operating-system file lock.
