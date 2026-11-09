# Validation

This records tested behaviour and remaining coverage limits; it is not a
certification of every Jellyfin feature or third-party plugin.

## Automated checks

- Production build succeeded. Upstream asset-size warnings remain.
- Lint passed with no errors; one pre-existing `HACK` comment warning remains.
- Upstream ES-Check passed for all 981 JavaScript files checked (ES5 compatible).
- The checked-in patch applied cleanly to a fresh checkout of the pinned release.
- Nine wrapper tests passed: four for supported-container profiles and five
  for Back focus restoration, including avoiding focus theft and editable fields.
- 31 regression tests passed for spoken media descriptions, generated icon
  names, dynamic title changes, dialogs, form/password labels, cleanup and
  leaving remote-key handling untouched.
- Additional tests cover Samsung keyboard Done advancing from Username to
  Password without sending credentials, normal password submission, and
  reaching Quick Connect instructions before the dismiss button.
- A headless Chromium check confirmed the native accessibility tree exposes
  playback controls, the track-selection dialog and selected audio-description
  track in a fixture using the accessibility adapter.
- The targeted axe checks reported zero violations in those tested controls.
- The packaged app booted with mocked Tizen APIs and a Tizen 6.0 user-agent,
  reached server selection, added a mocked Jellyfin 12.4 server and displayed
  public user selection and the manual-login form without JavaScript errors.
- The manual-login accessibility audit passed, including the password field's
  normal label. No real login or changes to a Jellyfin server were performed.

## Target television test, 9 November 2026

The signed 0.2.0 package was approved, installed and launched on the target
Samsung. The user confirmed that Voice Guide announced "Add Server", then
"Host", and that activating the field opened the TV keyboard. This confirms
native speech output works for startup and server entry on the actual TV.

Server sign-in, library browsing, synopsis reading and playback/track/seek
controls were tested further below. Web Inspector became available after
correcting the developer host to the PC's current Wi-Fi address.

The initial TV test exposed username Done submitting the form prematurely.
Version 0.2.1 changes that action to focus Password and makes alert text,
including digit-by-digit Quick Connect codes, reachable by Voice Guide.

The user approved Quick Connect and confirmed spoken library browsing. Live
inspection found named buttons and a focusable synopsis on the details page.

The user then reported movies not starting. On the actual TV, the media
element stalled on a reachable HTTP-200 MKV stream while canPlayType reported
no MKV support. Removing the falsely advertised MKV container produced an HLS
stream with readyState 4 and advancing playback time, without media errors.
The user confirmed that playback controls speak.

The user reported silent Back navigation. A delayed refresh of the restored
focused control resolved this, confirmed by the user. Version 0.2.2 contains
both corrections permanently. It was installed and freshly reloaded; native
inspection confirmed version 0.2.2, the corrected container profile, no temporary
test hooks, and the restored authenticated session. The user then confirmed
that movies start, playback controls speak, and Back announces the selected
item on this freshly installed permanent build.

The source changes leave the existing navigation implementation in place.
The installation must be followed by the checklist in ACCESSIBILITY.md, and
any problems found must be fixed before claiming full accessibility.

## Scope

The work targets Samsung's native Voice Guide in Jellyfin's TV interface.
Optional third-party server plugins and all server-administration workflows
have not been exhaustively tested. No replacement TTS voices are installed.
