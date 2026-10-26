# Verified metric source identifiers

Checked 2026-10-26. These identify the writing app, not a particular physical device.

## Hume Health

| Platform | Store identifier | Primary source |
| --- | --- | --- |
| Android | `com.elink.fittrackhealth.pro` | [Google Play listing](https://play.google.com/store/apps/details?id=com.elink.fittrackhealth.pro) |
| iOS | `com.elink.fittrackhealth` | [Apple lookup API](https://itunes.apple.com/lookup?id=1477782599&country=us), field `bundleId` |

The published app name is **Hume Health**, also confirmed by the [App Store listing](https://apps.apple.com/us/app/hume-health/id1477782599).

Health Connect exposes the writing app's package ID; our HealthKit adapter receives its bundle ID. Match the verified identifiers exactly, using the published app name only as a fallback. Do not assume the writing app is named after the physical Hume Band.

[Hume's FAQ](https://humehealth.com/pages/faq) describes Apple Health and Google Fit integration and says supported Band metrics can be shared. It does not provide a definitive current per-metric Health Connect export matrix. Store identifiers establish app identity, not which metrics are exported or whether another bridge app writes the records. A record written by a bridge retains the bridge's reported identity; do not relabel it as Hume without metadata establishing that origin.
