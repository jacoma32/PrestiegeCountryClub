# Enable real Friends and one-click multiplayer
The Friends UI and database logic are already in the game, but **it cannot go live until you connect your own Firebase project**.

1. Visit https://console.firebase.google.com/ and create a Firebase project (Spark plan works for initial testing).
2. Add a **Web app** and copy its configuration fields into `js/firebase-config.js`. These are public client configuration values; **never paste service-account private keys**.
3. In **Authentication → Sign-in method**, enable **Anonymous** sign-in.
4. Create a **Cloud Firestore** database. In its **Rules** tab, replace the existing rules with the contents of `firestore.rules` and Publish.
5. In Firebase Authentication → Settings → Authorized domains, add the GitHub Pages host `32jurini.github.io` if required.
6. Reload your GitHub Pages game and select **ONLINE PLAY**. Claim an online username on each browser, search the other player's exact username, send/accept a friend request, then host and select **JOIN GAME** on the friend's row.

**Important limits:** Anonymous Firebase authentication is tied to the browser/device; clearing site data loses access to that identity. This is not yet a cross-device email/password account migration. Status is approximate (recent activity within 90 seconds). Games still use PeerJS peer-to-peer signaling and may fail behind certain networks. This is an experimental friends feature, not a cheat-proof or production-ready multiplayer service. Friend requests and usernames live in Firestore; no server billing/security guarantees are implied.

Homepage membership is configured separately in [Supabase](SUPABASE-SETUP.md).
