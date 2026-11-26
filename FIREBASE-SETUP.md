# Enable real Friends and one-click multiplayer
The Friends UI and database logic are already in the game, but **it cannot go live until you connect your own Firebase project**.

1. Visit https://console.firebase.google.com/ and create a Firebase project (Spark plan works for initial testing).
2. Add a **Web app** and copy its configuration fields into `js/firebase-config.js`. These are public client configuration values; **never paste service-account private keys**.
3. In **Authentication → Sign-in method**, enable **Anonymous** sign-in.
4. Create a **Cloud Firestore** database. In its **Rules** tab, replace the existing rules with the contents of `firestore.rules` and Publish.
5. In Firebase Authentication → Settings → Authorized domains, add the GitHub Pages host `32jurini.github.io` if required.
6. Reload your GitHub Pages game and select **ONLINE PLAY**. Claim an online username on each browser, search the other player's exact username, send/accept a friend request, then host and select **JOIN GAME** on the friend's row.

**Important limits:** Anonymous Firebase authentication is tied to the browser/device; clearing site data loses access to that identity. This is not yet a cross-device email/password account migration. Status is approximate (recent activity within 90 seconds). Games still use PeerJS peer-to-peer signaling and may fail behind certain networks. This is an experimental friends feature, not a cheat-proof or production-ready multiplayer service. Friend requests and usernames live in Firestore; no server billing/security guarantees are implied.


## Homepage membership

The homepage uses the Firebase project configured in `js/firebase-config.js`. From that project’s Firebase console:

1. Under **Authentication → Sign-in method**, enable **Email/Password** and **Google**. Select a project support email when enabling Google.
2. Under **Authentication → Settings → Authorized domains**, add the hostname used for the live game. For the `jacoma32` GitHub Pages site, enter `jacoma32.github.io`.
3. On the published homepage, create a test account, sign out, sign in with email and password, and test **Sign in with Google**. Once both sign-in methods work on the live domain, the in-game legacy Account button can be removed.

Homepage membership uses a separate Firebase app instance so it does not replace the anonymous Friends identity or move saves between browsers.
