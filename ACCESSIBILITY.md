# Jellyfin Accessible for Samsung Tizen

This development build enables Samsung's native Voice Guide and improves the
spoken interface while retaining Jellyfin's existing remote navigation.
It uses the upstream Tizen wrapper and Jellyfin Web **12.4.0**, pinned to
`0a580ce8df89282dfd120b6d5efb8e106da23bd5`.

## Changes

- Explicitly enable `http://samsung.com/tv/metadata/use.voiceguide`.
- Start directly in the web client, with a launch-time autofocus element as
  required by Samsung's Voice Guide documentation.
- Give unnamed icon controls translated spoken names, including controls
  inserted after navigation. Preserve authored labels and form labels.
- Keep play/pause, mute and fullscreen names in sync with their state.
- Describe episodes with series, season and episode numbers; include movie
  years, artists, channel numbers and watched/resume status where available.
- Name track-selection dialogs, expose modal semantics, announce selected
  section buttons and provide a labelled playback slider with elapsed time.
- Make the synopsis reachable with the remote and expose toast notifications
  as polite status messages.
- On Samsung, move from Username to Password when the keyboard's Done action
  submits the username field. Keep password submission and Sign In working.
- Focus alert instructions before the dismiss button; read Quick Connect codes
  as separate digits.
- Remove MKV direct play when the TV's HTML video player reports no support,
  allowing Jellyfin to remux or transcode to a supported stream.
- Refresh the selected control after Back restores a cached view, so Voice
  Guide announces it. Skip editable fields, playback OSD and user-moved focus.

This uses Voice Guide itself, not a second speech engine or a cloud service.
The normal TV-wide Voice Guide switch, voice, volume and speech rate apply.
No new TV privileges, background services or SmartThings access are added.

## Build

Use Node 24 or newer, npm 11 or newer, Git and Python 3. On Windows:

```powershell
./scripts/build-accessible.ps1
```

The script fetches the pinned web source, applies the checked-in patch, installs
locked dependencies, runs the accessibility tests, builds production assets
and creates an **unsigned** package in `artifacts/`. It does not publish, sign
in to Samsung, request certificates or install anything on a TV.

To sign the package with an existing Samsung developer profile covering your TV:

```powershell
tz pack -t wgt -s YOUR_PROFILE -b artifacts/JellyfinAccessible-0.2.2-unsigned.wgt -o artifacts/JellyfinAccessible-0.2.2.wgt
```

Signing certificates, passwords, server addresses, authentication tokens and
personal library data are not part of this repository.

## Installation and verification

The separate package ID is `KlJfA11y01`; it does not replace the official
Jellyfin app. Existing official-app login data is not shared. Add your server
and sign in within the new app after installation.

The SDK install helper can uninstall a previous development build before
installing its replacement, removing its saved server and sign-in. Keep the
server address available and use Quick Connect if reauthentication is needed.

A successful build or browser accessibility test cannot certify Samsung's
actual speech output. Before calling the app fully accessible, verify with
Voice Guide enabled on the target TV:

1. Cold launch speaks and focuses server selection/login; typing and password
   entry use the TV's normal keyboard without reading passwords as labels.
2. Every library, search result, film, series, season and episode is spoken as
   the remote focus moves; Back returns focus sensibly.
3. Details and synopsis can be read; play, resume and context menus work.
4. Playback controls, time seeking, audio tracks, audio-description tracks and
   subtitles are spoken, including selected states and play/pause changes.
5. Dialogs, errors, user settings, sign out, app exit and app resume work.

Test music, Live TV, playlists and server-administration screens if used.
Not every optional server plugin or content type can be certified by the
automated checks. Keep findings and remaining gaps in `VALIDATION.md`.

## Upstream references and licence

- https://github.com/jellyfin/jellyfin-tizen
- https://github.com/jellyfin/jellyfin-web
- https://developer.samsung.com/smarttv/develop/guides/fundamentals/text-to-speech.html
- https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html

The upstream wrapper retains its MPL-2.0 licence. The web client and its patch
retain Jellyfin Web's GPL-2.0-or-later licence; the patched source is reproducible
from the pinned public commit and the patch distributed with this fork.
