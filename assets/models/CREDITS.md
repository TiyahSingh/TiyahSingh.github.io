# 3D asset record

Used on the Home world map and the Explore street. All of these files were downloaded and loaded as real models. Attribution is not required for any of them. Credit is still included here.

## Home world map

The Home landing is a floating neon island overview built in Three.js, with glowing HTML markers.

### Kenney — City Kit (Commercial) + EH98 free sample

- Same packs listed under “In the scene” below.
- Home places Kenney commercial buildings and EH98 lamps/vending on custom floating platforms with neon bridges. Platforms, beams, starfield, and markers are custom site art, not from the packs.
- Fallback imagery if WebGL fails: Eon Cire Neon Building birdseye render.

### Eon Cire — Simple 3D Neon Building (CC0)

- Source: https://opengameart.org/content/simple-3d-neon-building
- Zip: https://opengameart.org/sites/default/files/NeonBuilding.zip
- Licence: CC0
- Used imagery: `assets/images/home/city-birdseye.png` / `.jpg` and `neon-city.png` / `.jpg` (pack reference renders)
- Also kept locally: `assets/models/neonbuilding/NeonBuilding.fbx` and `BuildingTexture.png`
- Markers on the Home map are custom HTML overlays and are not part of the pack.

papptimus Cyber City (CC-BY) was attempted via itch PWYW; the download endpoint rate-limited. Quaternius Downtown / Cyberpunk Drive Google Drive quota was exceeded.

## In the scene

### Kenney — City Kit (Commercial) 2.1

- Source page: https://kenney.nl/assets/city-kit-commercial
- Downloaded file: https://kenney.nl/media/pages/assets/city-kit-commercial/a742d900eb-1753115042/kenney_city-kit-commercial_2.1.zip
- Licence: CC0 1.0 Universal. Free for a public portfolio, including commercial use. Attribution is appreciated but not required. Suggested credit: Kenney (www.kenney.nl).
- Local files: `assets/models/kenney/commercial/`
- Used models: building-a through building-j, building-skyscraper-a, building-skyscraper-e, detail-awning, detail-awning-wide, detail-overhang, detail-overhang-wide, detail-parasol-a, detail-parasol-b, low-detail-building-a, low-detail-building-b, low-detail-building-c, low-detail-building-wide-a, low-detail-building-wide-b, and `Textures/colormap.png`.
- The colormap was recolored in the browser to the black, neon pink, purple, and cyan palette. Shop signs (About, Skills, CV, Contact, Games) are custom and are not part of the pack.

### Kenney — City Kit (Roads)

- Source page: https://kenney.nl/assets/city-kit-roads
- Downloaded file: https://kenney.nl/media/pages/assets/city-kit-roads/74288c9459-1791628607/kenney_city-kit-roads.zip
- Licence: CC0 1.0 Universal. Attribution is appreciated but not required. Suggested credit: Kenney (www.kenney.nl).
- Local files: `assets/models/kenney/roads/`
- Used models: road-straight, road-crossing, light-curved, light-curved-double, dumpster, construction-cone, construction-barrier, road-sign-empty, and `Textures/colormap.png`.

### Quaternius — Animated Woman, via Poly Pizza

- Model page: https://poly.pizza/m/9kF7eTDbhO
- Downloaded file: https://static.poly.pizza/cf08b740-dd48-443e-9fde-6d3d54abf119.glb
- Licence: Public Domain (CC0). Free for a public portfolio. Attribution is not required. Author: Quaternius.
- Local file: `assets/models/character/animated-woman.glb`
- Rigged, with the clips `Armature|Idle` and `Armature|Walking` used. Clothing colours were shifted to pink, purple, and cyan. Skin tone was left as published.

## EH98 — Low Poly Cyberpunk City, free sample

- Page: https://eh98.itch.io/low-poly-cyberpunk-city-free-sample-5-models
- File: `LowPolyCyberpunkCity_FreeSample.zip` (634 kB)
- Licence: royalty-free, including commercial projects and a public portfolio. The models may be modified. They may not be resold or redistributed as an asset pack.
- The free sample contains five models only: `road_tile`, `street_lamp`, `sign_tall`, `vending_machine`, and `noodle_cart`. It does not include the arcade, towers, or shop buildings from the paid pack.
- Local files: `assets/models/eh98/road.glb`, `lamp.glb`, `sign.glb`, `vending.glb`, `noodle.glb`
- The road is the street surface. The vending machines are the arcade cabinets. Colours were shifted to pink, purple, and cyan.

## Kenney — City Kit (Commercial), fallback architecture

The free cyberpunk sample has no buildings. Kenney's CC0 commercial kit is the building fallback. See the Kenney entries above. Shop signs are custom.

## Not downloaded

### 3DAssets.dev cyberpunk buildings

The site returned 503 and `cdn.3dassets.dev` did not resolve, so none of these files are in the scene.

- Arcade frontage: https://cdn.3dassets.dev/assets/167/v1/model.glb → `assets/models/cyber/arcade-frontage.glb`
- Parcel hub: https://cdn.3dassets.dev/assets/166/v1/model.glb → `assets/models/cyber/parcel-hub.glb`
- Starter scene: https://cdn.3dassets.dev/assets/189/v1/model.glb → `assets/models/cyber/starter-scene.glb`
- Catalogue: https://3dassets.dev/assets?category=buildings&theme=cyberpunk
- Licence on the pages that were reachable: CC0.

### Quaternius — Downtown City MegaKit

No longer used. The free EH98 sample replaced it for the street props and road.

### Quaternius — Downtown City MegaKit (standard, free tier)

This pack is CC0 and is the preferred city kit, but itch.io only serves the zip after a name-your-price checkout. There is no direct file URL, so it is not in the scene. Do not treat the Kenney buildings as a substitute for this pack.

- Page: https://quaternius.itch.io/downtown-city-megakit
- Checkout: https://quaternius.itch.io/downtown-city-megakit/purchase
- File to download: `Downtown City MegaKit[Standard].zip` (about 223 MB, the free tier, CC0). The Source zip is paid and is not required.
- Place the zip here: `assets/models/_incoming/Downtown City MegaKit[Standard].zip`

The original zips for the Kenney kits and the character GLB are kept locally in `assets/models/_src/`. That folder is gitignored so the site does not publish unused archives.
