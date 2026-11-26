# Prestige Country Club — V4 School Presentation Build

A 3D golf-school project built with Three.js, HTML, CSS and JavaScript. This is a work-in-progress simulator, not PGA TOUR 2K.

## Features

- Homepage membership through Firebase email and Google sign-in. See [Firebase setup](FIREBASE-SETUP.md) to enable both methods.
- Male/female MyGolfer choice, colors and a saved browser profile
- Coach Timmy's seven-step on-screen tutorial, automatically offered on the first tee
- 19 supplied FBX animations packed into `assets/animations.zip`
- Split Timmy model in `assets/characters/Timmy.part1` and `.part2`; the browser reassembles it for animation
- Third-person swing camera that shows the backswing before the shot flight, an aiming tracer, club selection, powered shot timing, simulated hazards and scorecards
- Three stylized course environments with Three.js terrain, trees and course textures
- Generated Web Audio sound effects

## GitHub Pages

Upload all the **contents** of this folder into the root of the public `PrestiegeCountryClub` repository. `index.html` must be visible in the repository root. Keep the `js`, `assets` folders and `style.css`, `style-v4.css` in their relative paths. On GitHub, go to **Settings > Pages > Deploy from a branch > main > /(root)**. Once deployment finishes, visit `https://jacoma32.github.io/PrestiegeCountryClub/`.

**If the source code was already published automatically:** you only need to upload the three asset files contained in the separate `Prestiege-V4-GitHub-Asset-Upload.zip` file, preserving their `assets/` paths:

- `assets/animations.zip` (15.3 MB)
- `assets/characters/Timmy.part1` (17.2 MB)
- `assets/characters/Timmy.part2` (17.2 MB)

These are individually below GitHub's 25 MB browser-upload limit. Do not upload the ZIP *as one file* into GitHub: unzip it first, then drag in the `assets` directory and commit.

**Important:** The repository currently contains `assets/characters/X Bot.fbx` and `Y Bot.fbx` as fallback golfers. Coach Timmy uses the two split files. The game can load character animation files from the compressed animation pack.

## Controls

- `A/D`, left/right arrows: aim
- `1` driver; `2` 7 iron; `3` wedge; `4` putter
- Hold Space to power a shot and release to swing
- Drag mouse during gameplay to adjust camera orbit
- See the Clubhouse and Academy tabs for the tutorial

## School-project limitations

- Scores, equipment, and local golfer profiles are saved in this browser. The legacy in-game Account button is still available until the homepage sign-in methods are enabled and verified.
- 3D golfer model quality and material customization are limited by the source assets. Hair/eye tint changes only work on identifiable model materials.
- Timmy has on-screen tutorial dialogue and animation gestures, but no spoken voice narration.
- A browser gameplay pass on GitHub Pages and final animation rig testing are still required before a public presentation.
- Third-party Mixamo assets and external model resources require a license and redistribution review before any public release. This version is for school-project testing.