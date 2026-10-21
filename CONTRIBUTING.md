# Contributing to PhysiKey Card

Thanks for helping improve PhysiKey Card. This app manages real funds, so changes are reviewed carefully, especially anything that touches keys, signing or NFC.

## Before you start

- **Security issues:** don't open a public issue. Follow [SECURITY.md](SECURITY.md).
- **Bugs and ideas:** open an issue first for anything larger than a small fix, so we can agree on the approach before you write code.

## Setup

Follow [Getting started](README.md#getting-started) in the README. In short:

```bash
npm install
cp .env.testnet.example .env.testnet
cp .env.mainnet.example .env.mainnet
npm run base:sepolia
```

Develop and test against **Base Sepolia**. Never use mainnet funds while testing.

## Before opening a pull request

Run all three checks and make sure they pass:

```bash
npm test
npm run lint
npm run typecheck
```

Format the files you changed with `npx prettier --write <files>`.

## Rules for security-sensitive code

- **Never change the key derivation by accident.** `__tests__/deriveKey.test.js` pins the private key and address produced for known card + password inputs. If it fails, your change would move every existing user to a different wallet. Don't update the pinned values unless the pull request is explicitly about changing the derivation, and say so clearly in its description.
- **Don't hold secrets longer than needed.** Copy card data into a local variable and clear the screen state before using it (see `confirmSign()` in `Send.js`), clear password fields once submitted, and never put keys, card data or passwords in `AccountContext`, AsyncStorage or navigation params that outlive a login. See [What stays in memory](README.md#what-stays-in-memory).
- **Never log secrets.** Don't `console.log` card entropy, passwords, private keys, Keychain values or full NFC read results, even temporarily.
- **Never commit API keys.** Real keys belong in `.env.testnet` / `.env.mainnet`, which are gitignored. Only edit the `.example` templates in commits.
- **Keep user confirmation in front of every transfer.** Don't add code paths that sign without a card tap and password (or, for Instant Accept accounts, an explicit Send).

## Pull requests

- Keep each pull request focused on one change.
- Describe what changed and why, and how you tested it. Say which platform and device you tested on (NFC needs a physical device).
- Add or update tests where it's practical.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
