# iOS development

Run this in the project terminal:

```sh
npm run ios
```

For remote development, it starts Metro if needed, opens Simulator on the other Mac, and launches Owwed. Keep the terminal open while editing. Ctrl+C stops Metro if this command started it.

These optional settings belong in `.env.local` and are documented in `.env.example`:

```dotenv
REACT_NATIVE_PACKAGER_HOSTNAME=development-mac
IOS_SIMULATOR_HOST=preview-mac
```

The simulator host must be reachable over SSH without a password prompt. Leave `IOS_SIMULATOR_HOST` unset to keep the normal local iOS build workflow.

The development build must already be installed in the preview simulator. After native changes, rebuild on the development Mac with `npm run ios:build`, then copy and install the new simulator app. JavaScript and TypeScript changes do not need a native rebuild.
