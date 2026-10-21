# PhysiKey Card

A React Native app (iOS and Android) that turns a $0.10 NFC sticker/card into a cold-storage key card for a USDC wallet on [Base](https://base.org).

This project was built to provide the market with a supply-chain resistant cold storage key management tool using currently available open source hardware as the form factor. It allows developers to turn dumb NFC tags into cold storage key management tools that can operate as a USDC payment card on Base. These NFC tags can be purchased by the user from any online retailer for $0.10, meaning this is a great option for global users needing cold storage hardware cybersecurity tools without cost prohibitive prices of $50+.

The user experience guides a user through a three-tap account setup with NXP NTAG 213 and 215 tags, including a user PIN / password that operates as a 25th word passphrase, meaning every new PIN / password creates a separate private key. The app creates an ERC-4337 smart account connected to a [Pimlico](https://pimlico.io) paymaster, so the developer can pay the user's gas and the user only ever holds USDC.

> **⚠️ Use at your own risk.** This software handles real funds and has **not** been independently security audited. It is provided as-is under the [MIT License](LICENSE), without warranty of any kind. You are responsible for reviewing the code, testing on Base Sepolia before using mainnet, and for any funds held in wallets it creates. Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
>
> 

https://github.com/user-attachments/assets/421ff774-1dd8-48eb-aaa3-3848c247b2c2



---

## Contents

- [How it works](#how-it-works)
- [Security model](#security-model)
- [App flows](#app-flows)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [Getting started](#getting-started)
- [Development](#development)
- [Forking checklist](#forking-checklist)
- [Adding a card on-ramp](#adding-a-card-on-ramp)
- [Known issues](#known-issues)
- [Troubleshooting](#troubleshooting)
- [Contributing, security and license](#contributing-security-and-license)

---

## How it works

### Key management primitive

The card never stores a private key. It stores random entropy, and the key is re-derived from card + password every time it is needed.

1. **Write** 32 bytes of secure random entropy to the tag as an NDEF text record (hex encoded). See [writeToCard.ts](src/functions/core/writeToCard.ts).
2. **Lock** the tag against accidental overwrites by enabling the NTAG's built-in write password. See [enablePassword.js](src/functions/core/enablePassword.js) and the [security model](#security-model) for what this does and does not protect.
3. **Read** the entropy back from the tag on every login or signature. See [readCard.ts](src/functions/core/readCard.ts).
4. The user enters a **password / PIN**, which works like a 25th word passphrase: a different password on the same card produces a completely different wallet.
5. Entropy + password are concatenated and stretched with **Argon2id** (4 iterations, 32 MiB memory, parallelism 2, fixed app-wide salt) to slow down brute-force attempts on a stolen card.
6. The Argon2 output is hashed twice with Keccak-256 to produce an Ethereum private key.
7. That key is the **owner** of an ERC-4337 smart account; it signs the transaction and then goes out of scope.

Steps 4–6 live in `derivePrivateKey()` in [deriveKey.js](src/functions/core/deriveKey.js); `accountLogin()` in [accountFunctions.js](src/functions/core/accountFunctions.js) calls it and builds the smart account (step 7). The derivation is pinned by [a test](__tests__/deriveKey.test.js) so that no change can silently move users to different wallets.

```
NFC tag entropy ─┐
                 ├─► Argon2id(salt) ─► keccak256(keccak256(h) + h) ─► owner key ─► SimpleAccount (ERC-4337)
user password ───┘
```

### Smart account and gasless transfers

- The owner key controls a [SimpleAccount](https://github.com/eth-infinitism/account-abstraction) created through the canonical **EntryPoint v0.7** SimpleAccount factory (`0x91E6…8985`, deployed at the same address on Base and Base Sepolia). The same card + password therefore gives the same address on both networks. The factory is part of how the wallet address is computed: **changing `ACCOUNT_FACTORY_ADDRESS` gives every user a different address**, just like changing the salt. (`0x9406…6454` is the older EntryPoint v0.6 factory and does not work with this code.)
- The wallet address is counterfactual: it exists before any transaction, and the account contract is deployed by the first outgoing transfer.
- Transfers are sent as user operations through Pimlico's bundler and paymaster (`transferUSDC()` in [accountFunctions.js](src/functions/core/accountFunctions.js)), using [permissionless](https://docs.pimlico.io/permissionless) and [viem](https://viem.sh). Your Pimlico account pays the gas, so users never need ETH.
- Balances are read directly from the USDC contract over RPC ([getBaseUSDC.js](src/functions/core/getBaseUSDC.js)); history comes from Blockscout or Etherscan ([getBaseUSDCActivity.js](src/functions/core/getBaseUSDCActivity.js); see [Transaction history](#transaction-history)).
- Amounts are converted with exact decimal math (`parseUsdcAmount()` in [usdc.js](src/functions/core/usdc.js)), never floating point, so the amount sent always matches the amount shown.

### Two kinds of accounts

| | Card account | Instant Accept (device) account |
|---|---|---|
| Secret | Entropy on the NFC tag + user password | 70-character random string in the phone's Keychain / Keystore |
| Created by | Card Login → three-tap setup | Opening **Accept Payment** for the first time |
| Used for | Holding and sending USDC | Receiving payments as a merchant |
| Storage class | Cold: nothing secret stays on the phone | Hot: the secret lives on the device |

Instant Accept lets a phone act as a payment terminal: the merchant enters an amount, the customer taps their card and enters their PIN on the merchant's phone, and USDC moves from the customer's card account to the device account. The device secret is passed to `accountLogin()` as both the "tag" and the "password", so the same derivation code is used for both account types.

---

## Security model

Read this before forking for production use.

**What protects a card account**
- The private key is never stored: not on disk, not in the Keychain, not in app state, and never logged. It is re-derived from the card and password for each login or signature, and released as soon as that operation finishes. See [What stays in memory](#what-stays-in-memory).
- A stolen card alone is not enough: the attacker also needs the password, and each guess costs one Argon2id run.
- A password alone is not enough: the attacker also needs the card's entropy.
- Before signing, `transferUSDC()` checks that the card + password derive the account the user is signed in to, and that it holds enough USDC. A mistyped password or the wrong card is refused with a clear message instead of signing from a different wallet. After sending, it confirms the USDC transfer actually succeeded on-chain before showing success.

**⚠️ Whoever's phone you tap on holds your private key at that moment**

The private key is derived on the phone that reads the card and receives the PIN. That device has full control of the wallet for as long as the app chooses to keep the key. This affects two flows where someone enters their card and PIN on **another person's phone**:

- **Instant Accept:** a customer taps their card and types their PIN on the **merchant's** phone to pay.
- **Send → Scan Card:** to fill in a recipient by card, the **recipient** types their PIN on the **sender's** phone.

This repository's code only uses the key to sign the transfer the user confirmed and then discards it. But this is open-source software: anyone can build a modified version that looks identical and silently drains every card used on it. A card + PIN gives no protection against the device it's entered on. Make sure users understand:

- Only tap your card and enter your PIN in an app you trust, on a device you trust, from a source you trust (an official app store listing).
- If you're unsure about a merchant's device, pay a smaller "spending" card rather than your main card. Each card + password is a separate wallet.
- To receive funds, prefer sharing your **address** (it's public and safe) over tapping your card and entering your PIN on someone else's phone.
- If you publish a fork, users trust *your* build with their keys. Build it from reviewed source, sign it with a key you protect, and say where people can verify it.

**Limitations to be aware of**
- **The salt is fixed and public.** `salt` in [deriveKey.js](src/functions/core/deriveKey.js) is `'BklcooclkncUhnaiianhUcnklcooclkB'` for every user. Changing it gives your fork a proprietary key set, but every card + password will then derive a *different* wallet than in other builds, so existing users would lose access to their funds in your app. Decide before you ship, never after. If you do change it, `npm test` will fail until you regenerate the pinned values in `__tests__/deriveKey.test.js`.
- **Short passwords are weak.** The app accepts passwords of 4+ characters. Argon2id slows guessing but a 4-digit PIN still only has 10,000 possibilities for someone holding the card. Consider enforcing a longer minimum.
- **The tag lock prevents accidents, not attacks.** The NTAG write password (`0x1234abcd`) is the same for every card and visible in source. Anyone can still *read* the entropy with a phone; the security relies on the password.
- **Instant Accept accounts are hot wallets.** Treat them like a cash register: sweep funds to a card account regularly. Deleting the app or wiping the phone loses the Keychain secret and any funds left in that account. The optional [reset screen](#optional-screen-resetting-a-merchants-device-address) generates a new device secret, which permanently abandons the old address.
- **Spending limits are client-side only.** The app blocks single transfers ≥ 3,000 USDC and stops sending once 24-hour volume (in + out, from the [transaction history](#transaction-history)) reaches 10,000 USDC. If history can't be loaded, the 24-hour total can't be counted and only the per-transfer limit applies. These are UX guardrails to stay under limits that require KYC, not on-chain limits.


### What stays in memory

| Secret | Where it lives | How long |
|---|---|---|
| **Private key** | A local variable inside `derivePrivateKey()` / `transferUSDC()` and the signing account built from it | Only while one login, verification or transfer runs: key derivation, a balance check, signing, and waiting for confirmation (capped at 2 minutes) |
| **Card entropy** (read from the tag) | The screen that scanned the card | Cleared from screen state as soon as it's used, or when the password prompt is dismissed (Send, Request, Load Card). After a card login, the navigation history is reset so the login screens holding it are unmounted |
| **Password / PIN** | The password prompt (`InputModal`) or login screen | Cleared from the prompt as soon as it's submitted or dismissed; login screens are unmounted after login (see above) |
| **Instant Accept device secret** | The phone's Keychain (iOS) / Keystore (Android) | Persistently, by design: this is what makes device accounts [hot wallets](#security-model) |
| **Wallet address** | App state and, for saved accounts, AsyncStorage | Persistently. Addresses are public and safe to keep |

"Cleared" and "released" mean the app drops every reference so the value can be garbage collected. **JavaScript cannot overwrite memory**, so a value stays in RAM until the garbage collector reuses that space, and the OS or keyboard may keep their own copies of typed text. On a phone compromised at root level, an attacker could still scrape these from RAM. The app's job is to keep that window as short as possible, not to make it zero.

---

## App flows

All transaction flows live in `src/screens/`. Multi-step flows keep a `step` state and render each step conditionally inside one screen.

### Navigation map

```
Landing
├── Accept Payment ──► Request ............ Instant Accept: merchant enters amount, customer taps card + PIN
│                       └── account button ► Home (device account): balance, history,
│                                            Load Card → Send / Cashout to withdraw (signs with the Keychain secret)
└── Card Login ──────► Login (scan card)
                        ├── empty tag ──► AddAccount ...... three-tap setup: write entropy, lock tag, set password
                        └── written tag ► CompleteLogin ... enter password
                                             └──► Home (tabs)
                                                  ├── Account ... balance, address, Send
                                                  ├── History ... recent USDC transfers
                                                  └── Load Card . Transfer → ZeroFee (deposit via your own wallet / exchange)
                                                  Send ......... transfer USDC (see below)
```

Navigation is defined in [AppNavigator.js](src/components/AppNavigator.js); shared account state (address, balance, activity, `isCard`) lives in [AccountContext.js](src/contexts/AccountContext.js).

### Example: sending USDC ([Send.js](src/screens/Send.js))

- **Step 0 – Enter recipient.** The user pastes an address or taps another PhysiKey card. A card tap sets `recipTag`, and the recipient's address is derived via `handlePasswords()`. `recipientError()` rejects malformed addresses, bad checksums and sending to yourself before moving on.
- **Step 1 – Enter amount.** Validated with `parseUsdcAmount()`: greater than 0, at most 6 decimal places, and less than 3,000.
- **Step 2 – Sign and send.** The user taps their own card (`fetchSign()` sets `tagID`), enters their password, and `confirmSign()` calls `transferUSDC()` with `expectedSender` set to the signed-in account.
- **Step 3 – Result.** Shows success only once the transfer succeeded on-chain; otherwise shows the specific reason (wrong card or password, not enough USDC, rejected on-chain, or not confirmed yet).

When `isCard` is false (an Instant Accept device account), `instantAcceptSign()` signs with the Keychain secret instead of asking for a card and password.

NFC on Android needs an in-app "ready to scan" prompt, so `AndroidScanModal` is shown on Android only; iOS shows the system NFC sheet.

---

## Project structure

```
├── App.tsx, index.js, global.js   Entry point, fetch polyfill; console.log is disabled in release builds
├── start.js                       Copies .env.testnet / .env.mainnet over .env (used by npm scripts)
├── .env.*.example                 Config templates; copy to .env.testnet / .env.mainnet (gitignored)
├── __tests__/deriveKey.test.js    Pins the key derivation (see Development)
├── patches/                       patch-package fixes applied to node_modules on install
├── LICENSE, LICENSES/             MIT license for this project; third-party licenses (League Spartan font)
├── SECURITY.md, CONTRIBUTING.md   Vulnerability reporting and contribution guidelines
├── src/
│   ├── screens/                   One file per route; flows are step-based state machines
│   ├── components/                Reusable UI: buttons, modals, NFC scan prompt, activity lists, navigator
│   ├── contexts/AccountContext.js App-wide account state and the login helper setNewAccount()
│   ├── functions/core/            Logic with no UI
│   │   ├── deriveKey.js           Card + password → private key (Argon2id, salt)  ← security-critical
│   │   ├── accountFunctions.js    Smart account login and USDC transfer           ← security-critical
│   │   ├── writeToCard.ts         Write entropy to a blank tag
│   │   ├── readCard.ts            Read entropy (resultCode 0 = blank tag, 1 = written tag)
│   │   ├── enablePassword.js      Enable the NTAG write password
│   │   ├── getBaseUSDC.js         USDC balance over RPC
│   │   ├── getBaseUSDCActivity.js Transfer history from Blockscout or Etherscan V2
│   │   ├── usdc.js                Amount parsing, balance formatting, address checks, history parsing
│   │   ├── generateRandomString.js Secure random secret for Instant Accept accounts
│   │   └── asyncStorage.js        Saved account names → addresses (no secrets)
│   ├── styles/common.js           Shared styles (many styles still live inline in screens)
│   ├── types/                     TypeScript declarations for untyped packages
│   └── assets/                    Images, fonts, icons
├── ios/                           Xcode project (open PhysiKeyCard.xcworkspace, not the .xcodeproj)
└── android/                       Gradle project, package com.physikey.card
```

`disablePassword.js` isn't used by the app. It's kept as a developer utility for removing the write lock from a tag, for example to reuse a test card.

### Optional screen: resetting a merchant's device address

[InstantAcceptConfigure.js](src/screens/InstantAcceptConfigure.js) is registered as the `InstantAcceptConfigure` route, but no screen links to it in this version. It's kept so forks can turn it on.

**What it does:** after a confirmation dialog ([WarningModal.js](src/components/WarningModal.js)), it generates a new 70-character device secret, replaces the old one in the Keychain / Keystore, and switches the app to the new Instant Accept address.

**When it's useful:**
- A merchant hands the phone to a new owner or employee and wants a fresh address.
- A device secret may have been exposed, for example through a debug log or a compromised phone.
- You want separate addresses per shift or per event to keep records apart.

**Before you enable it:** the old secret is overwritten, not archived, so **any USDC still at the old address becomes unreachable from the app**. Make sure the merchant has withdrawn everything first (Load Card → Send / Cashout). Ideally, extend the screen to check the balance and refuse to reset while it's above zero.

**To enable it,** add a button wherever merchants manage their account, for example next to **Accept Payment** in the `!isCard` branch of [Home.js](src/screens/Home.js):

```jsx
<CustomButton
  text="New Address"
  type="secondary"
  size="small"
  onPress={() => { navigation.navigate('InstantAcceptConfigure'); }}
/>
```

---

## Configuration

Network settings and API keys are compiled into the app from `.env` via [react-native-dotenv](https://github.com/goatandsheep/react-native-dotenv). Create your local config files from the templates, then replace the `YOUR_...` placeholders in them:

```bash
cp .env.testnet.example .env.testnet
cp .env.mainnet.example .env.mainnet
```

`.env`, `.env.testnet` and `.env.mainnet` are gitignored, so your keys stay on your machine. Only the `.example` templates are committed.

| Variable | Required | Where to get it |
|---|---|---|
| `PIMLICO_RPC_URL` (the `apikey=` part) | Yes | [Pimlico dashboard](https://dashboard.pimlico.io). Bundler and paymaster for gasless transfers; fund the paymaster for mainnet. |
| `ETHERSCAN_API_KEY` | No | [Etherscan](https://etherscan.io/apidashboard). Optional; see [Transaction history](#transaction-history). Etherscan requires a **paid plan** for Base and Base Sepolia. Leave empty to use the free Blockscout API. |

The other variables are already set correctly for each network:

| Variable | Testnet (Base Sepolia) | Mainnet (Base) |
|---|---|---|
| `CHAIN_ID` | `84532` | `8453` |
| `BASE_USDC_CONTRACT` | `0x036C…CF7e` | `0x8335…2913` |
| `ACCOUNT_FACTORY_ADDRESS` | `0x91E6…8985` (EntryPoint v0.7 SimpleAccountFactory) | same |
| `RPC_URL` | `https://sepolia.base.org` | `https://mainnet.base.org` |
| `BLOCKSCOUT_API_URL` | `https://base-sepolia.blockscout.com/api` | `https://base.blockscout.com/api` |

### Transaction history

The History tab and the 24-hour limit read USDC transfers from an Etherscan-compatible explorer API ([getBaseUSDCActivity.js](src/functions/core/getBaseUSDCActivity.js)):

- **Default: Blockscout** (`BLOCKSCOUT_API_URL`). Free and needs no key. In testing, Base Sepolia worked reliably, but `base.blockscout.com` (mainnet) blocked automated requests with a Cloudflare bot check. Before shipping on mainnet, confirm it answers from your app; if it doesn't, use Etherscan.
- **Optional: Etherscan V2** (`ETHERSCAN_API_KEY`). Used whenever the key is set. One key covers every chain, selected with `chainid`, but Etherscan's own chain list marks Base and Base Sepolia as **"Paid Plan required"**.

Only the newest 100 transfers are fetched. If the request fails (no network, rate limit, invalid key or plan), the History tab says history is unavailable instead of showing an empty list. Balances are unaffected, since they're read directly from the chain.

The `npm run base:*` scripts copy the selected file over `.env`, which is what the app reads, so edits made directly to `.env` are overwritten. Because values are compiled in, restart Metro with `--reset-cache` (the scripts do this) after changing them.

> Never commit real keys. Anything in `.env` ships inside the app bundle and can be extracted from a release build, so use keys you can restrict and rotate (Pimlico supports per-key policies and spending limits).

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- **iOS:** macOS with full Xcode (not just the Command Line Tools), CocoaPods, and a physical iPhone 7 or newer. NFC does not work in the simulator, and tag reading requires a paid Apple Developer account for the NFC entitlement.
- **Android:** Android Studio, **JDK 17**, and a physical device with NFC. Newer Android Studio versions bundle a newer Java that this project's Gradle version can't run on, so install JDK 17 separately (for example `brew install --cask zulu@17`) and select it under *Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK*. The project also needs Android SDK Platform 34, Build-Tools 34.0.0 and NDK 26.1.10909125; Android Studio downloads them on the first Gradle sync, or you can install them from *Settings → Languages & Frameworks → Android SDK*.
- NXP **NTAG 213 or 215** stickers or cards

### 1. Install

```bash
git clone https://github.com/YOUR_ORG/PhysiKeyCard.git
cd PhysiKeyCard
npm install
```

`postinstall` applies the patches in `patches/` and pre-builds the iOS JavaScript bundle.

### 2. Configure

```bash
cp .env.testnet.example .env.testnet
cp .env.mainnet.example .env.mainnet
```

Then fill in the API keys as described in [Configuration](#configuration).

### 3. Run

Start Metro with the network you want. This also writes `.env`:

```bash
npm run base:sepolia    # testnet
npm run base:mainnet    # mainnet
```

Then, in a second terminal:

```bash
npm run android
# or, for iOS
cd ios && pod install && cd ..
npm run ios -- --device
```

You can also open `ios/PhysiKeyCard.xcworkspace` in Xcode, select your device and press Run. Set your own signing team under Signing & Capabilities first.

For Android Studio, open the **`android/` folder**, not the repository root. Opening the root makes Android Studio try to sync the libraries' own Android projects inside `node_modules`, each with a different Gradle version, which fails with errors like `Could not use Gradle version 7.0.2 and Java version 17`.

### Release builds

- **Android:** run `npm run build:android:base:sepolia` or `npm run build:android:base:mainnet`. Without further setup, the release APK is signed with the debug key, which is fine for installing on test devices but not for the Play Store. To publish, [generate an upload keystore](https://reactnative.dev/docs/signed-apk-android), put it in `android/app/`, and add its settings to your personal `~/.gradle/gradle.properties`, **not** the committed `android/gradle.properties`:

  ```properties
  MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
  MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
  MYAPP_UPLOAD_STORE_PASSWORD=...
  MYAPP_UPLOAD_KEY_PASSWORD=...
  ```

  `*.keystore` files are gitignored (except the standard React Native `debug.keystore`).
- **iOS:** run `npm run base:mainnet` (or `base:sepolia`) so `.env` is correct, then archive from Xcode.

---

## Development

```bash
npm test             # Jest: pins the card + password → key derivation
npm run lint         # ESLint + Prettier
npm run typecheck    # TypeScript (tsc --noEmit)
npx prettier --write <files>   # format before committing
```

The key-derivation test replaces the native `react-native-argon2` module with [hash-wasm](https://github.com/Daninet/hash-wasm), which produces byte-identical Argon2id output, so it runs in Node without a phone. If it fails, your change would give existing users different wallet addresses. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## Forking checklist

- [ ] **App identity:** change the bundle ID / application ID (`com.physikey.card`) in Xcode and `android/app/build.gradle`, plus the display name in `app.json`, `Info.plist` and `strings.xml`.
- [ ] **iOS signing:** no Apple Developer team is set in the Xcode project. Choose yours under Signing & Capabilities, and enable the Near Field Communication Tag Reading capability.
- [ ] **Branding:** replace the logo and app icons in `src/assets/` and `ios/PhysiKeyCard/Images.xcassets/AppIcon.appiconset/`, and the Android launcher icons in `android/app/src/main/res/mipmap-*`.
- [ ] **Salt:** keep it to stay compatible with existing PhysiKey cards, or change it once, before launch, for a proprietary key set. See [Security model](#security-model).
- [ ] **API keys:** your own Pimlico key (fund the paymaster or set a sponsorship policy for mainnet), and decide how to provide [transaction history](#transaction-history) on mainnet.
- [ ] **On-ramp (optional):** let users buy USDC with a bank card in the app. See [Adding a card on-ramp](#adding-a-card-on-ramp).
- [ ] **Web links:** `ZeroFee.js` opens `https://example.com/loadcard` and `/cashout`. Point these at your own help pages.
- [ ] **Learn more link:** `Landing.js` links "Don't have a card?" to `https://physikey.xyz`.
- [ ] **Limits:** the 3,000 USDC per-transfer and 10,000 USDC per-24-hour limits are in `Send.js` and `Request.js`.
- [ ] **License:** keep the MIT [LICENSE](LICENSE) notice in your fork, as the license requires.

---

## Adding a card on-ramp

This version ships without an on-ramp. Users load a card by sending USDC on Base from their own wallet or an exchange, as explained on the **Load Card → No Fees** tab. If your fork should let users buy USDC with a debit card or bank transfer inside the app, you can add a provider such as Coinbase Onramp, MoonPay, Ramp Network or Stripe's crypto onramp. Most of them work the same way: you open a hosted widget with the user's wallet address already filled in, and the provider takes payment, handles identity checks (KYC), and sends USDC to that address.

### Where it goes

The **Load Card** tab is [Transfer.js](src/screens/Transfer.js). It holds a top-tab navigator that currently has one tab, `No Fees`. For card accounts, the tabs only appear after the user re-taps their card and enters their password (valid for 5 minutes). That check confirms `publicKey` matches the card in hand before any money is pointed at it, so keep your on-ramp behind it.

### Steps

1. **Sign up with a provider** and get their public widget / app ID. Use their sandbox while you test on Base Sepolia.
2. **Add the public ID to config.** Add a line such as `ONRAMP_APP_ID="..."` to `.env.testnet` and `.env.mainnet` (and a placeholder to the matching `.example` files), and import it in code with `import { ONRAMP_APP_ID } from '@env';`.
3. **Keep secret keys off the phone.** Everything in `.env` is compiled into the app and can be extracted. Many providers require each widget URL to be signed, or a session token to be created, with a secret key. Do that on a small backend of your own and have the app ask it for the URL.
4. **Create a screen** in `src/screens/` that builds the widget URL and renders it with `react-native-webview`, which is already installed:

   ```jsx
   // src/screens/BuyUSDC.js
   import React, { useContext } from 'react';
   import { WebView } from 'react-native-webview';
   import { AccountContext } from '../contexts/AccountContext';
   import { ONRAMP_APP_ID } from '@env';

   const BuyUSDC = () => {
     const { publicKey } = useContext(AccountContext);
     // Parameter names differ by provider; check their docs. Lock the asset and network
     // so users can't buy a token or chain this wallet doesn't support.
     const url = `https://onramp.example.com/?appId=${ONRAMP_APP_ID}` +
       `&walletAddress=${publicKey}&network=base&asset=USDC`;
     return <WebView source={{ uri: url }} />;
   };

   export default BuyUSDC;
   ```

5. **Add it as a tab** in both branches of `renderTabs()` in `Transfer.js`:

   ```jsx
   <Tab.Screen name="Buy" component={BuyUSDC} />
   ```

   If the provider doesn't allow embedding in a web view, open the URL in the system browser instead with `Linking.openURL(url)` from `react-native`.

6. **Refresh the balance** after a purchase. The provider can take a few minutes to deliver, so call `updateAccount(publicKey)` from `AccountContext` when the user returns to the Account tab, or listen for the provider's completion event if it has one.

### Selling (off-ramp)

Off-ramps work the other way round: the provider gives you a deposit address and an amount, and the user sends USDC there. You can reuse `transferUSDC()` in [accountFunctions.js](src/functions/core/accountFunctions.js) for that, behind the same card tap and password confirmation that [Send.js](src/screens/Send.js) uses. Never sign a transfer without the user's explicit confirmation.

### Before you ship

- Confirm the provider supports **USDC on Base** in the countries you plan to serve.
- Your agreement with the provider, and its fees and regional rules, are your responsibility as the app publisher.
- Mention the provider in your app's privacy policy, since it collects identity and payment details.

---

## Known issues

- **NTAG 216 is not fully supported.** `enablePassword.js` only distinguishes 213 from 215. On a 216 it writes to ordinary data pages instead of the configuration pages, so the card works but is never write-locked.
- **Only the newest 100 transfers** are fetched (`offset=100`), so older history is not shown. The 24-hour total is unaffected unless an account makes more than 100 transfers in a day.
- **Mainnet history via Blockscout may be blocked.** `base.blockscout.com` answered automated requests with a Cloudflare bot check during testing. Verify it from your app before a mainnet release, or set `ETHERSCAN_API_KEY` (paid). See [Transaction history](#transaction-history).

---

## Troubleshooting

- **`xcode-select: error: tool 'xcodebuild' requires Xcode` / `Invalid glog.podspec`** during `pod install`: point the developer tools at full Xcode:
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  ```
- **`Unable to resolve module dependency: 'Argon2'`** in Xcode 26+: the `post_install` hook in `ios/Podfile` fixes this. Re-run `pod install` if you see it.
- **`Command PhaseScriptExecution failed` when the project path contains spaces:** React Native 0.74's build scripts don't quote paths. This repo fixes both affected build steps: "Generate Specs" via `patches/react-native+0.74.7.patch` (applied automatically by `npm install`), and "Bundle React Native code and images" directly in the Xcode project. If a build step still fails this way, move the project to a path without spaces.
- **Android Gradle sync fails with `Unsupported class file major version`** (or a similar Java version error): Gradle is running on a Java newer than 21. Install JDK 17 and select it as the Gradle JDK in Android Studio (see [Prerequisites](#prerequisites)). For terminal builds, also set `JAVA_HOME`: `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` if you installed the Zulu cask, or `export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home` if you installed Homebrew's `openjdk@17` formula (which macOS's `java_home` doesn't detect).
- **`Could not use Gradle version 7.0.2` (or 4.10.1 / 7.5.1) in Android Studio:** you opened the repository root. Close the project and open the `android/` folder instead; it uses Gradle 8.6 from its own wrapper.
- **`SDK location not found`** when building Android from the terminal: add `export ANDROID_HOME=$HOME/Library/Android/sdk` to your shell profile, or open the `android/` folder in Android Studio once so it writes `android/local.properties`.
- **Changed `.env` values aren't picked up:** restart Metro with `--reset-cache`.
- **NFC scans don't start on iOS:** confirm the Near Field Communication Tag Reading capability is enabled for your signing team, and that you're on a physical device.

- **`Environment file .env.testnet does not exist`:** create it from the template with `cp .env.testnet.example .env.testnet` (or `mainnet`).

For anything else, see React Native's [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

---

## Contributing, security and license

- **Contributing:** see [CONTRIBUTING.md](CONTRIBUTING.md).
- **Security:** please don't report vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).
- **License:** [MIT](LICENSE). The bundled League Spartan font is licensed under the [SIL Open Font License 1.1](LICENSES/LeagueSpartan-OFL.txt).
