"""Build the static portfolio pages, posters, and QR codes."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import json
import qrcode
import urllib.request

ROOT = Path(r"C:\Users\User\Desktop\website")
POSTERS = ROOT / "assets" / "posters"
PROCESS = ROOT / "assets" / "process"
QR = ROOT / "assets" / "qr"
CABINETS = ROOT / "assets" / "cabinets"
# Simple cabinet canvas + portrait screen (posters are portrait)
CABINET_SIZE = (420, 560)
CABINET_SCREEN = (58, 48, 362, 390)  # left, top, right, bottom
for folder in (POSTERS, PROCESS, QR, CABINETS, ROOT / "games"):
    folder.mkdir(parents=True, exist_ok=True)

FONT = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 28)
FONT_SM = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 18)
FONT_LG = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 42)

PINK = (255, 62, 200)
PURPLE = (177, 75, 255)
PAPER = (247, 241, 255)
INK = (12, 8, 16)


def cover(url, dest):
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    urllib.request.urlretrieve(url, dest)
    return dest


def cover_fit(image, size):
    """Scale + center-crop so the poster fills the cabinet screen."""
    tw, th = size
    src = image.convert("RGBA")
    sw, sh = src.size
    scale = max(tw / max(sw, 1), th / max(sh, 1))
    nw, nh = max(1, int(sw * scale)), max(1, int(sh * scale))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    left = max(0, (nw - tw) // 2)
    top = max(0, (nh - th) // 2)
    return resized.crop((left, top, left + tw, top + th))


def draw_simple_cabinet():
    """Clean pink arcade shell with a tall portrait screen for posters."""
    w, h = CABINET_SIZE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    body = (236, 72, 168, 255)
    body_dark = (168, 36, 120, 255)
    bezel = (40, 16, 48, 255)
    panel = (255, 196, 230, 255)
    accent = (122, 240, 255, 255)
    # outer body
    draw.rounded_rectangle((18, 12, w - 18, h - 10), radius=28, fill=body_dark)
    draw.rounded_rectangle((28, 22, w - 28, h - 22), radius=22, fill=body)
    # screen bezel
    sx0, sy0, sx1, sy1 = CABINET_SCREEN
    draw.rounded_rectangle((sx0 - 14, sy0 - 14, sx1 + 14, sy1 + 14), radius=16, fill=bezel)
    draw.rounded_rectangle((sx0 - 6, sy0 - 6, sx1 + 6, sy1 + 6), radius=10, fill=(12, 6, 18, 255))
    # control deck
    deck_top = sy1 + 28
    draw.rounded_rectangle((46, deck_top, w - 46, h - 48), radius=14, fill=panel)
    draw.rounded_rectangle((46, deck_top, w - 46, deck_top + 10), radius=4, fill=accent)
    # stick + buttons
    stick_x, stick_y = 110, deck_top + 52
    draw.ellipse((stick_x - 18, stick_y - 18, stick_x + 18, stick_y + 18), fill=(255, 70, 120, 255))
    draw.rectangle((stick_x - 5, stick_y - 40, stick_x + 5, stick_y), fill=(250, 240, 255, 255))
    for i, color in enumerate([(80, 160, 255, 255), (255, 80, 120, 255), (255, 210, 70, 255)]):
        bx = 250 + i * 42
        by = stick_y
        draw.ellipse((bx - 14, by - 14, bx + 14, by + 14), fill=color)
        draw.ellipse((bx - 14, by - 14, bx + 14, by + 14), outline=(255, 255, 255, 220), width=2)
    # coin ledge
    draw.rounded_rectangle((w // 2 - 36, h - 42, w // 2 + 36, h - 28), radius=6, fill=bezel)
    return img


def make_cabinet(poster_path, dest):
    frame = draw_simple_cabinet()
    sx0, sy0, sx1, sy1 = CABINET_SCREEN
    screen = cover_fit(Image.open(poster_path), (sx1 - sx0, sy1 - sy0))
    out = frame.copy()
    out.paste(screen, (sx0, sy0))
    # thin neon rim over the poster edge
    rim = ImageDraw.Draw(out)
    rim.rounded_rectangle((sx0 - 2, sy0 - 2, sx1 + 1, sy1 + 1), radius=6, outline=(255, 180, 230, 230), width=3)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "PNG", optimize=True)
    return True


def fit(src, size=(1400, 788)):
    image = Image.open(src).convert("RGB")
    image.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, INK)
    x = (size[0] - image.width) // 2
    y = (size[1] - image.height) // 2
    canvas.paste(image, (x, y))
    return canvas


def fit_natural(src, max_side=1400):
    """Keep the poster's real aspect ratio — no letterbox bars."""
    image = Image.open(src).convert("RGB")
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image


def pixel_scene(colors, motif):
    w, h = 40, 22
    grid = [[colors[0] for _ in range(w)] for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if (x + y) % 7 == 0:
                grid[y][x] = colors[1]
    if motif == "sea":
        for y in range(12, h):
            for x in range(w):
                grid[y][x] = colors[2] if (x + y) % 3 else colors[3]
        for x in range(6, 34, 5):
            grid[10][x] = colors[4]
            grid[9][x] = colors[4]
    elif motif == "run":
        for x in range(w):
            grid[16][x] = colors[2]
            if x % 4 == 0:
                grid[15][x] = colors[3]
        grid[12][8] = colors[4]
        grid[13][8] = colors[4]
        grid[14][9] = colors[4]
    elif motif == "fire":
        for y in range(8, 18):
            for x in range(16, 24):
                grid[y][x] = colors[2] if y % 2 else colors[3]
    elif motif == "cat":
        for y in range(8, 16):
            for x in range(14, 26):
                grid[y][x] = colors[2]
        grid[7][15] = colors[3]
        grid[7][24] = colors[3]
        grid[11][18] = colors[4]
        grid[11][22] = colors[4]
    elif motif == "dragon":
        for x in range(8, 30):
            grid[12][x] = colors[2]
            grid[11][x] = colors[3]
        grid[8][28] = colors[4]
        grid[9][30] = colors[4]
    elif motif == "mind":
        for y in range(6, 16):
            for x in range(12, 28):
                if (x + y) % 2 == 0:
                    grid[y][x] = colors[2]
        grid[10][19] = colors[4]
        grid[10][21] = colors[4]
    elif motif == "mosaic":
        for y in range(4, 18, 2):
            for x in range(4, 36, 3):
                grid[y][x] = colors[(x + y) % 4 + 1]
                grid[y][x + 1] = colors[(x + y) % 3 + 1]
    elif motif == "potion":
        for y in range(8, 16):
            for x in range(17, 23):
                grid[y][x] = colors[2]
        grid[7][19] = colors[3]
        grid[7][20] = colors[3]
        grid[6][19] = colors[4]
    elif motif == "hive":
        for y in range(6, 16, 2):
            for x in range(8, 32, 3):
                grid[y][x] = colors[2]
                grid[y + 1][x + 1] = colors[3]
    elif motif == "hospital":
        grid[8][20] = colors[4]
        for y in range(6, 16):
            grid[y][20] = colors[4]
        for x in range(16, 25):
            grid[11][x] = colors[4]
    elif motif == "mirror":
        for y in range(6, 16):
            grid[y][12] = colors[4]
            grid[y][27] = colors[2]
            grid[y][13] = colors[2]
    else:
        for x in range(w):
            grid[18][x] = colors[2]
    image = Image.new("RGB", (w, h))
    px = image.load()
    for y in range(h):
        for x in range(w):
            px[x, y] = grid[y][x]
    return image.resize((1400, 788), Image.Resampling.NEAREST)


def stamp(image, title, credits):
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rectangle((0, 560, 1400, 788), fill=(8, 4, 12, 210))
    draw.rectangle((0, 560, 1400, 568), fill=PINK)
    draw.text((36, 590), title.upper(), font=FONT_LG, fill=PAPER)
    draw.text((36, 660), credits, font=FONT_SM, fill=PINK)
    draw.rectangle((0, 0, 1399, 787), outline=PURPLE, width=8)
    return image


def save_jpg(image, path):
    image.convert("RGB").save(path, "JPEG", quality=82, optimize=True)


def make_qr(url, path):
    qr = qrcode.QRCode(border=2, box_size=8)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    img.save(path, "PNG")


def process_card(lines, accent):
    image = Image.new("RGB", (1400, 788), (16, 8, 24))
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1399, 787), outline=accent, width=8)
    draw.text((48, 48), "PROCESS LOG", font=FONT_LG, fill=accent)
    y = 140
    for line in lines:
        draw.text((48, y), "> " + line, font=FONT, fill=PAPER)
        y += 52
    return image


PROCESS_LINES = {
    "clinical-trial": [
        "Four roles: manager, doctor, nurse, janitor",
        "Break room used as the role switch",
        "Each finished task spends two hours",
        "Pharmacy mini-game built in Unity",
        "Group prototype filed on GitHub",
    ],
    "charmfire": [
        "Unreal Engine 5 Blueprint combat",
        "States for sprint, attack, flee, death",
        "Strategies swapped during a fight",
        "Pistol hit and grenade projectile",
        "Individual reports stored in the repo",
    ],
    "no-exit": [
        "Lanes, jump, and slide",
        "Core overload if the run stops",
        "Neon barriers, lasers, flying cars",
        "Drones and turrets as bosses",
        "Rules written in the GADE report",
    ],
    "echos-lament": [
        "Jam theme: Echo and Reflection",
        "Narcissus steered, Echo mirrored",
        "Both exits must be occupied",
        "Move limit on later levels",
        "HTML5 build published on itch.io",
    ],
    "hive-mind": [
        "Witch body cannot open the doors",
        "Possess the skeleton on the plate",
        "Mana drain and a lost life",
        "Boxes hold plates after release",
        "Playable as Hex Mind on itch.io",
    ],
    "a-cats-tale": [
        "Windows Forms tile map",
        "WASD and arrow movement",
        "Grunt enemies and health pickups",
        "Save and load added in Part 3",
        "Shared report by both developers",
    ],
    "aqua-alchemy": [
        "Client pitch written in Canva",
        "Unity prototype in the repository",
        "Schedule tracked with the build",
        "Reference list filed with the pitch",
        "Two contributors on the repository",
    ],
    "noesis": [
        "Concept title: Depth of the Mind",
        "Unity scene and audio pass",
        "Horror ambience in the project",
        "Code references documented",
        "Three contributors on the repository",
    ],
    "dreamy-mosaics": [
        "Unity 6.3 level prototype",
        "WASD movement and player glow",
        "Win and lose panels",
        "Brightness and mute settings",
        "About and controls screens",
    ],
    "dragon-slayers": [
        "Windows Forms battle flow",
        "Opening form starts the fight",
        "Turn passes to the player form",
        "Three-part GADE schedule",
        "Presentation recorded for Part 3",
    ],
}

GAMES = [
    {
        "slug": "bushveld-brothers",
        "title": "Bushveld Brothers",
        "genre": "Ranger adventure",
        "engine": "Unity",
        "languages": ["C#"],
        "showcase": True,
        "card": "A short 3D patrol where you read spoor, rescue wildlife, and detain poachers.",
        "credits": "Tiyah Singh, David Barker, Barrie-George Davies, Jamie-Lee Davies",
        "team": "Starr Studios / Games for Africa jam team — Tiyah Singh, David Barker (Omega0), Barrie-George Davies (TheBgster), Jamie-Lee Davies.",
        "synopsis": "Bushveld Brothers is a short 3D ranger adventure set in the South African bushveld. You play Barries on a timed patrol: read spoor, free snared animals, and detain poachers before sunset. The fantasy inverts hunting games — animals are wards, poachers are the quarry, and the ending is an arrest, not a kill.",
        "brief": "Made in three days for a YellowDot Africa campus jam on the theme Games for Africa: Stories, Cultures and Connections, with a mobile-first requirement. The jam prototype was later treated as a Starr Studios commercial concept for a premium short Steam adventure: a readable patrol loop, South African bushveld identity, Ubuntu-centred non-lethal conflict, and store-ready pitch / UI / documentation artefacts.",
        "role": "Project manager, lead UI/UX designer, gameplay programmer, and documentation lead on the Starr Studios roster.",
        "contributions": "Kept the production schedule and documentation; designed menus, HUD, win/lose and settings flow; implemented gameplay systems in C#; wrote production records and portfolio packaging for the jam build and the later commercialisation POE (studio identity, roadmap, Steam assets, and UI style work).",
        "tech": ["Unity", "C#", "3ds Max", "GitHub", "itch.io", "Canva", "Steam store art"],
        "demo": "https://omega0.itch.io/bushveld-brothers",
        "demo_label": "Playable itch.io page",
        "download": "https://omega0.itch.io/bushveld-brothers",
        "download_label": "Windows & Android builds",
        "photo": r"C:\Users\User\Desktop\website\game stuff\bushveld brothers poster.png",
        "process_photo": r"C:\Users\User\Desktop\GADS\GADS_Project\Part2\pdf_images\storyboard_contact_sheet.jpg",
        "screenshots": [
            r"C:\Users\User\Desktop\GADS\Part2\Bushveld_Brothers_Steam_Main_Capsule_1232x706.png",
            r"C:\Users\User\Desktop\GADS\GADS_Project\Part2\assets\key_art_wide.png",
        ],
        "motif": "sea",
        "note": "",
    },
    {
        "slug": "dont-forget-to-say-goodbye",
        "title": "Don't Forget to Say Goodbye",
        "genre": "Narrative horror",
        "engine": "Unity 6",
        "languages": ["C#"],
        "showcase": True,
        "card": "A haunted manor, ritual puzzles, and a Ouija board answered by a local language model.",
        "credits": "Tiyah Singh, David Barker",
        "team": "Tiyah Singh and David Barker — Unity project hosted as Ouija-Game.",
        "synopsis": "You explore a haunted manor, solve ritual puzzles, and speak to a spirit through a Ouija board. A local Llama 3.2 model (via Ollama) writes the opening story and very short board replies. Scripted gates keep critical plot answers stable. Saying GOODBYE closes the session. The experience stays fully local — no cloud API.",
        "brief": "GADS Game Design POE: build a haunted-house prototype with functional local LLM integration using Ollama. The board had to stay safe and consistent, so free replies are short, critical answers are authored in advance, setup is reproducible, and the work includes technical + showcase videos plus prompt / integration documentation.",
        "role": "Lead design and art direction — occult interface, ritual props, manor visual language, and player-facing board UX.",
        "contributions": "Shaped the occult UI and ritual prop language; art-directed the manor look; designed how the Ouija board presents AI replies so the system feels diegetic; supported the LLM-in-the-loop play fantasy while keeping authored plot gates intact.",
        "tech": ["Unity 6 (6000.4.1f1)", "C#", "Ollama", "Llama 3.2", "Whisper.unity", "TextMesh Pro", "GitHub"],
        "demo": "https://canva.link/gj0ke405qwcgs47",
        "demo_label": "Showcase video",
        "download": "https://github.com/DavidBarker05/Ouija-Game",
        "download_label": "Unity project on GitHub",
        "photo": r"C:\Users\User\Desktop\website\game stuff\dftsg poster.png",
        "process_photo": r"C:\Users\User\Downloads\DFTSG UI Elements\BloodRune1Image.png",
        "screenshots": [
            r"C:\Users\User\Desktop\GADS\DFTSGgif.gif",
            r"C:\Users\User\Downloads\DFTSG UI Elements\BloodRune1Image.png",
        ],
        "motif": "fire",
        "note": "Fiction about grief, death, and the occult. Aimed at players 16 and older.",
    },
    {
        "slug": "clinical-trial",
        "title": "Clinical Trial",
        "genre": "Hospital simulation",
        "engine": "Unity",
        "languages": ["C#"],
        "showcase": True,
        "card": "Run an under-resourced public clinic by switching between four hospital jobs.",
        "credits": "Tiyah Singh, L.A. van der Zee, Jamie-Lee Davies, Jacques Willemse",
        "team": "Clinical Trial Devs — Tiyah Singh, L.A. van der Zee (LazjessicahvdZ), Jamie-Lee Davies, Jacques Willemse (FeelGoodBinJuice).",
        "synopsis": "Clinical Trial is a 3D multi-role hospital management simulation about South African public healthcare under pressure. You switch between Manager, Doctor, Nurse, and Janitor to treat patients, scrub filth, balance the budget, and survive stolen medicine, power outages, and patient influxes while keeping sanitation, comfort, morale, and related clinic stats alive. One bad shift and the clinic shuts down.",
        "brief": "WIL / XBCGD7311–7312 serious-game brief: design and ship a 3D hospital simulation that raises awareness of systemic public-healthcare challenges (HAIs, overcrowding, staff shortages, corruption, outages, resource scarcity). Players must feel scarcity, switch roles, and keep the clinic running through planned work and sudden emergencies, with research-backed documentation and public itch.io / GitHub delivery.",
        "role": "Programming, UI/UX design, technical documentation, and visual presentations (slides and gameplay videos).",
        "contributions": "Debugged and refined interconnected Unity/C# clinic systems (nurse medication sorting, patient treatment, doctor referrals, infection identification); designed and implemented the in-game staff manual and role dictionary after playtest feedback; improved nurse interfaces and hospital waypoint / directional UI; produced pitch presentations and gameplay demonstration videos; built a QR feedback path for presentations; contributed related pharmacy simulation work (Pharmacist Mini Game).",
        "tech": ["Unity", "C#", "3D clinic scenes", "UI/UX", "GitHub", "itch.io", "Canva"],
        "demo": "https://feelgoodbinjuice.itch.io/clinical-trial",
        "demo_label": "Playable itch.io build",
        "download": "https://feelgoodbinjuice.itch.io/clinical-trial",
        "download_label": "Windows download",
        "photo": r"C:\Users\User\Desktop\website\game stuff\clinical trial poster.png",
        "process_photo": r"C:\Users\User\Desktop\WIL\S1\images\medicalscreenpanel1.png",
        "screenshots": [
            r"C:\Users\User\Desktop\GADS\ClinicalTrialGIF.gif",
            r"C:\Users\User\Desktop\WIL\S1\images\medicalscreenpanel1.png",
            r"C:\Users\User\Desktop\WIL\S1\images\medicalscreenpanel2.png",
            r"C:\Users\User\Desktop\WIL\S1\images\startscreenbackround.png",
        ],
        "motif": "hospital",
        "note": "Rated 4.6/5 on itch.io from community playtests. GitHub: LJ-vdZ/XBCGD7312_Clinical-Trial.",
    },
    {
        "slug": "selkie-song",
        "title": "Selkie Song",
        "genre": "Folklore platformer",
        "engine": "Unity 6 · C#",
        "languages": ["C#"],
        "showcase": False,
        "card": "A selkie crosses broken docks, collecting the pieces of her stolen skin.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "A sailor stole a selkie's skin, trapping her in human form. Fragments of that skin are scattered across broken docks above the ocean. You jump from platform to platform, collect the fragments, and use checkpoints. Falling into the water costs a life. When the skin is whole again, she can return to the sea.",
        "brief": "Selkie Song is the GADE7321 group project. The brief was a playable narrative platformer with dialogue, collectibles, checkpoints, and enemy patterns, documented with schedules, code references, and individual presentations.",
        "role": "Tiyah developed the Unity project. The build includes a player state machine, dialogue, checkpoints, collectibles, moving platforms, and patrolling enemies. Her reports and presentations are linked from the repository.",
        "contributions": "Player state machine, dialogue, checkpoints, collectibles, moving platforms, and patrolling enemies in the Unity build.",
        "tech": ["Unity 6 (6000.0.38f1)", "C#", "State machine", "Dialogue data", "NavMesh enemies"],
        "demo": "https://canva.link/55m6gytbp41gzc6",
        "demo_label": "Video presentation",
        "download": "https://github.com/TiyahSingh/GADE7321POE",
        "download_label": "Project repository",
        "photo": r"C:\Users\User\Desktop\website\selkie song poster.png",
        "process_photo": r"C:\Users\User\Downloads\Selkie Song UI Assets (1)\playbutton.png",
        "screenshots": [],
        "motif": "sea",
        "note": "",
    },
    {
        "slug": "charmfire",
        "title": "Charmfire",
        "genre": "Action prototype",
        "engine": "Unreal Engine 5",
        "card": "A Blueprint combat prototype where fighters and bots change tactics as the fight turns.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Charmfire is a combat prototype in which the player sprints, fights, and can fall, while bots patrol, attack, flee, and look for health. Weapons do not share one behaviour: a pistol hits immediately, and a grenade launcher fires a projectile.",
        "brief": "The GADE brief was an Unreal Engine 5 game whose combat and AI could grow without collapsing into one giant script. The team separated actions into states and decisions into strategies so new behaviour could be added without rewriting player input.",
        "role": "Tiyah developed the Unreal project. The gameplay is built in Blueprints, with state objects for movement and combat and strategy objects for bot decisions.",
        "tech": ["Unreal Engine 5", "Blueprints", "State pattern", "Strategy pattern", "GitHub"],
        "demo": "https://github.com/Jamie-LeeD/GADE_POE",
        "demo_label": "Project repository",
        "download": "https://github.com/Jamie-LeeD/GADE_POE",
        "download_label": "Unreal project",
        "photo": r"C:\Users\User\Desktop\website\charmfire poster.png",
        "process_photo": "",
        "motif": "fire",
        "note": "A separate gameplay video is not published. The repository is both the demo record and the download.",
    },
    {
        "slug": "no-exit",
        "title": "No Exit",
        "genre": "Endless runner",
        "engine": "Unity · C#",
        "card": "A cyberpunk runner. Stop moving and the energy core overloads.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "No Exit is a cyberpunk endless runner, documented in development as CyberBreak. You are a rogue experiment whose energy core kills you if you stop. The road throws neon barriers, laser grids, flying cars, drones, and turrets at you. There is no finish line. The score is how far you survive.",
        "brief": "The GADE endless-runner brief asked for lane movement, jumping, sliding, escalating obstacles, bosses, and power-ups. The repository is named EndlessRunnerPOE. Tiyah's rules document sets the fail state: if the avatar stops for more than a second, the run ends.",
        "role": "Tiyah developed the runner and wrote the descriptive rules for the player, obstacles, bosses, power-ups, world hazards, and scoring.",
        "tech": ["Unity", "C#", "Prefabs", "GameManager", "PlayerController", "Obstacle spawner"],
        "demo": "https://www.canva.com/design/DAGq19TwetI/VwHPPKo5JAdROqIYztfwTA/edit",
        "demo_label": "Process presentation",
        "download": "https://github.com/Jamie-LeeD/EndlessRunnerPOE",
        "download_label": "EndlessRunnerPOE repository",
        "photo": "",
        "process_photo": "",
        "motif": "run",
        "note": "",
    },
    {
        "slug": "echos-lament",
        "title": "Echo's Lament",
        "genre": "Mirror puzzle",
        "engine": "Unity · HTML5",
        "card": "Move Narcissus. Echo answers every step in the opposite direction.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Echo's Lament is a short grid puzzle made for a jam on the theme Echo and Reflection. You steer Narcissus. Echo moves as his opposite: up becomes down, and left becomes right. Both of them must stand on their exits at the same time. A move that saves one can trap the other.",
        "brief": "The jam brief was to turn the theme into the rule of the game, using the myth of Narcissus and Echo. Reflection is not decoration. Every input is two inputs, and some levels limit how many moves you have.",
        "role": "Tiyah worked on the jam game. The playable build is the public page.",
        "tech": ["Unity", "HTML5", "Grid movement", "itch.io"],
        "demo": "https://jamesleed.itch.io/echos-lament",
        "demo_label": "Play in the browser",
        "download": "https://jamesleed.itch.io/echos-lament",
        "download_label": "Playable itch.io build",
        "photo_url": "https://img.itch.zone/aW1nLzI4NDE4MjYzLnBuZw==/original/8PIi2W.png",
        "photo": "",
        "process_photo": "",
        "motif": "mirror",
        "note": "",
    },
    {
        "slug": "hive-mind",
        "title": "Hive Mind",
        "genre": "Possession puzzle",
        "engine": "Unity · HTML5",
        "card": "A witch borrows skeletons to hold open the doors of a dungeon.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Hive Mind is published on itch.io as Hex Mind. You play a necromancy witch in a locked dungeon. Stand near a door, possess the skeleton bound to it, and walk that skeleton onto a pressure plate. Mana drains while you are inside a skeleton. If it runs out, you are thrown back into your own body and lose a life. Boxes can hold a plate down after you leave.",
        "brief": "The prototype brief was a first-person puzzle about possession: the witch cannot open the doors herself, so the solution is to spend mana, use the skeleton, and still escape in her own body.",
        "role": "Tiyah worked on Hive Mind. The GitHub project is HiveMind and the playable page is Hex Mind.",
        "tech": ["Unity", "HTML5", "First-person movement", "Possession", "Pressure plates"],
        "demo": "https://jamesleed.itch.io/hex-mind",
        "demo_label": "Play Hex Mind",
        "download": "https://github.com/Jamie-LeeD/HiveMind",
        "download_label": "HiveMind repository",
        "photo_url": "https://img.itch.zone/aW1nLzMxMDQ3OTg0LnBuZw==/original/G3LRpM.png",
        "photo": "",
        "process_photo": "",
        "motif": "hive",
        "note": "",
    },
    {
        "slug": "a-cats-tale",
        "title": "A Cat's Tale",
        "genre": "Grid adventure",
        "engine": "C# · Windows Forms",
        "card": "A tile adventure of grunts, health pickups, and a hero who has to think ahead.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "A Cat's Tale is a grid adventure played through a Windows Forms map. You move with WASD or the arrow keys, avoid tiles that block or hurt you, and fight grunt enemies that wander and attack when they are next to you. Health pickups restore 10 hit points. Later parts add tougher enemy types, save and load, and a guide so the rules stay readable.",
        "brief": "The GADE brief was a C# game whose later stage raised the strategic pressure: more enemies, clearer feedback, and save points so a run could be continued. The map, level, rules, and buttons all live on one form.",
        "role": "Tiyah wrote the game and the Part 3 report. The map, enemies, health pickups, and save system are part of that build.",
        "tech": ["C#", "Windows Forms", "2D tile arrays", "Save and load", "GitHub"],
        "demo": "https://drive.google.com/file/d/1O6--lpsyQUCy9AQoNQFzCTdsZlAl406K/view",
        "demo_label": "Demonstration video",
        "download": "https://github.com/Jamie-LeeD/ACatsTalePOE_Copy",
        "download_label": "Public project copy",
        "photo": "",
        "process_photo": "",
        "motif": "cat",
        "note": "",
    },
    {
        "slug": "aqua-alchemy",
        "title": "Aqua Alchemy",
        "genre": "Client prototype",
        "engine": "Unity",
        "card": "A pitched prototype about alchemy and water, built as a playable Unity project.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Aqua Alchemy is a GADS prototype about alchemy and water, presented to a client and built in Unity. The public record of the idea is the pitch presentation. The playable project, schedule, and reference list live in the repository.",
        "brief": "The brief was a client-facing prototype: a pitch that explains the game, plus a Unity build, a project schedule, and a reference list that shows where the work came from.",
        "role": "Tiyah contributed the prototype, the pitch, and the production documents published with the project.",
        "tech": ["Unity", "C#", "Canva pitch", "Project schedule", "GitHub"],
        "demo": "https://www.canva.com/design/DAG27j2PPAA/j7RCqfqVMnJL_GDgLp8u8Q/edit",
        "demo_label": "Client pitch",
        "download": "https://github.com/Jamie-LeeD/Aqua_Alchemy",
        "download_label": "Unity project",
        "photo": "",
        "process_photo": "",
        "motif": "potion",
        "note": "",
    },
    {
        "slug": "noesis",
        "title": "Noesis",
        "genre": "Atmosphere prototype",
        "engine": "Unity",
        "card": "Depth of the Mind: a Unity prototype built around dread, space, and sound.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Noesis, also titled Depth of the Mind, is a Unity prototype aimed at mood and exploration. The project is built with horror ambience, footsteps, and a hospital environment pack, and it is documented with a code reference list.",
        "brief": "The GADS concept brief was to take an idea called Depth of the Mind and turn it into a prototype with a cited bibliography, rather than a finished commercial game.",
        "role": "Tiyah contributed to the Depth prototype and its reference documentation.",
        "tech": ["Unity", "C#", "Audio ambience", "Environment art pack", "GitHub"],
        "demo": "https://github.com/Jamie-LeeD/Depth",
        "demo_label": "Depth repository",
        "download": "https://github.com/Jamie-LeeD/Depth",
        "download_label": "Unity project",
        "photo": r"C:\Users\User\Desktop\website\noesis poster.png",
        "process_photo": "",
        "motif": "mind",
        "note": "A standalone trailer is not published. The repository is the public build.",
    },
    {
        "slug": "dreamy-mosaics",
        "title": "Dreamy Mosaics",
        "genre": "Level prototype",
        "engine": "Unity 6",
        "card": "A glowing character, keyboard movement, and levels with win and lose screens.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Dreamy Mosaics is a Unity 6 level prototype. The player moves with WASD, carries a glow light, and plays toward win and lose screens. The build includes an about panel, a controls panel, brightness controls, and a mute button.",
        "brief": "The prototype brief was a small, readable level game: movement, feedback when you win or lose, and settings a player can find without leaving the level.",
        "role": "Tiyah is presenting this prototype with the rest of her released work.",
        "tech": ["Unity 6.3", "C#", "Post-processing", "UI panels", "GitHub"],
        "demo": "https://github.com/Jamie-LeeD/Dreamy-Mosaics-Prototype",
        "demo_label": "Prototype repository",
        "download": "https://github.com/Jamie-LeeD/Dreamy-Mosaics-Prototype",
        "download_label": "Unity project",
        "photo": "",
        "process_photo": "",
        "motif": "mosaic",
        "note": "",
    },
    {
        "slug": "dragon-slayers",
        "title": "Dragon Slayers",
        "genre": "Turn-based battle",
        "engine": "C# · Windows Forms",
        "card": "A turn-based dragon battle.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Dragon Slayers is a Windows Forms battle. The opening form starts the fight and hands the turn to the player. The GADE project grew across three parts, from the first forms to a finished battle build, a game report, and a presentation.",
        "brief": "The GADE5121 brief was a C# Windows Forms game made in a pair, with a schedule, a reference list, a written game report, and a recorded presentation of the finished part.",
        "role": "Tiyah built the Windows Forms battle, from the opening form through the player turn, with a game report and a presentation.",
        "tech": ["C#", "Windows Forms", ".NET", "GitHub"],
        "demo": "https://files.fm/u/4abdprzq6a",
        "demo_label": "Presentation video",
        "download": "https://github.com/TiyahSingh/POEDragonSlayers",
        "download_label": "Private repository",
        "photo": "",
        "process_photo": "",
        "motif": "dragon",
        "note": "The repository is private, so the download link asks GitHub to sign in before the code can be cloned.",
    },
]

SHOWCASE_ORDER = ["clinical-trial", "dont-forget-to-say-goodbye", "bushveld-brothers"]
ADDITIONAL_ORDER = ["selkie-song", "charmfire", "noesis"]
LISTED_ORDER = SHOWCASE_ORDER + ADDITIONAL_ORDER
for game in GAMES:
    game["showcase"] = game["slug"] in SHOWCASE_ORDER
    game["additional"] = game["slug"] in ADDITIONAL_ORDER
    game["listed"] = game["slug"] in LISTED_ORDER
    game.setdefault("languages", ["C#"] if "C#" in " ".join(game.get("tech", [])) else [])
    game.setdefault("contributions", game.get("role", ""))
    game.setdefault("screenshots", [])
_by_slug = {game["slug"]: game for game in GAMES}
# Portfolio list order: showcase trio, then only the three additional poster games
GAMES = [_by_slug[slug] for slug in LISTED_ORDER if slug in _by_slug] + [
    game for game in GAMES if game["slug"] not in LISTED_ORDER
]
LISTED_GAMES = [game for game in GAMES if game.get("listed")]


def header(title="", nav=""):
    links = [
        ("/", "Home", "home"),
        ("/explore.html", "Explore", "play"),
        ("/about.html", "About", "about"),
        ("/skills.html", "Skills", "skills"),
        ("/games.html", "Games", "games"),
        ("/cv.html", "CV", "cv"),
        ("/contact.html", "Contact", "contact"),
    ]
    items = "\n      ".join(
        f'<a href="{href}"{" class=\"is-on\" aria-current=\"page\"" if key == nav else ""}>{label}</a>'
        for href, label, key in links
    )
    if nav == "home":
        body = ' class="home"'
    elif nav == "play":
        body = ' class="explore-page"'
    elif nav == "about":
        body = ' class="about-page"'
    elif nav == "skills":
        body = ' class="skills-galaxy-page"'
    elif nav == "cv":
        body = ' class="cv-page"'
    elif nav == "contact":
        body = ' class="contact-page"'
    else:
        body = ""
    extra_css = ""
    if nav == "skills":
        extra_css = '\n  <link rel="stylesheet" href="/css/galaxy.css?v=18">'
    elif nav == "cv":
        extra_css = '\n  <link rel="stylesheet" href="/css/cv.css?v=6">'
    elif nav == "contact":
        extra_css = '\n  <link rel="stylesheet" href="/css/contact.css?v=9">'
    heading = "Tiyah Singh — Game Developer" if not title else f"{title} — Tiyah Singh"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{heading}</title>
  <meta name="description" content="Game developer portfolio of Tiyah Singh. Selected projects, roles, and playable links.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Spicy+Rice&display=swap" rel="stylesheet">
  <link rel="icon" href="/assets/brand/favicon.png" type="image/png">
  <link rel="stylesheet" href="/css/site.css?v=76">{extra_css}
</head>
<body{body}>
  <a class="skip" href="#content">Skip to content</a>
  <div class="scanlines" aria-hidden="true"></div>
  <header class="hud">
    <a class="logo" href="/" aria-label="Tiyah Singh home">
      <img src="/assets/brand/main-logo.png" alt="Tiyah Singh" width="240" height="143">
    </a>
    <nav class="nav" aria-label="Primary">
      {items}
    </nav>
  </header>
"""


def footer():
    return """  <footer class="site-footer">
    <a class="footer-logo" href="/" aria-label="Tiyah Singh home">
      <img src="/assets/brand/main-logo.png" alt="Tiyah Singh" width="220" height="131">
    </a>
    <nav class="footer-socials" aria-label="Social links">
      <a class="footer-social" href="https://www.linkedin.com/in/tiyah-singh-906352236/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
        <img src="/assets/brand/social/linkedin.png?v=2" alt="" width="40" height="40">
      </a>
      <a class="footer-social" href="https://tiyahsingh.itch.io/" target="_blank" rel="noopener noreferrer" aria-label="itch.io">
        <img src="/assets/brand/social/itch.png?v=2" alt="" width="40" height="40">
      </a>
      <a class="footer-social" href="mailto:singhtiyah@gmail.com" aria-label="Email">
        <img src="/assets/brand/social/gmail.png?v=2" alt="" width="40" height="40">
      </a>
      <a class="footer-social" href="https://github.com/TiyahSingh" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
        <img src="/assets/brand/social/github.png?v=2" alt="" width="40" height="40">
      </a>
    </nav>
    <p class="footer-copy">2026 by Tiyah Singh</p>
  </footer>
  <script src="/js/arcade.js"></script>
</body>
</html>
"""


def build_images():
    portrait_src = Path(r"C:\Users\User\Desktop\Tiyah\TiyahSingh_ProfilePicture.jpeg")
    portrait = Image.open(portrait_src).convert("RGB")
    side = min(portrait.size)
    left = (portrait.width - side) // 2
    top = max(0, (portrait.height - side) // 2 - 40)
    portrait = portrait.crop((left, top, left + side, top + side)).resize((900, 900), Image.Resampling.LANCZOS)
    portrait.save(ROOT / "assets" / "portrait.jpg", "JPEG", quality=84, optimize=True)

    about_dir = ROOT / "assets" / "about"
    about_dir.mkdir(parents=True, exist_ok=True)
    # Scrapbook snaps from the same portrait (different crops) for the My Scene-style strip
    snap_specs = [
        ("snap-1.jpg", (0.08, 0.02, 0.78, 0.72)),
        ("snap-2.jpg", (0.22, 0.08, 0.95, 0.82)),
        ("snap-3.jpg", (0.12, 0.18, 0.88, 0.95)),
        ("snap-4.jpg", (0.28, 0.0, 0.98, 0.7)),
        ("snap-5.jpg", (0.05, 0.12, 0.7, 0.78)),
        ("snap-6.jpg", (0.18, 0.22, 0.92, 0.98)),
    ]
    for name, (x0, y0, x1, y1) in snap_specs:
        box = (
            int(portrait.width * x0),
            int(portrait.height * y0),
            int(portrait.width * x1),
            int(portrait.height * y1),
        )
        snap = portrait.crop(box).resize((420, 420), Image.Resampling.LANCZOS)
        snap.save(about_dir / name, "JPEG", quality=86, optimize=True)
    portrait.resize((1100, 1100), Image.Resampling.LANCZOS).save(
        about_dir / "hero.jpg", "JPEG", quality=88, optimize=True
    )

    shots_root = ROOT / "assets" / "screenshots"
    shots_root.mkdir(parents=True, exist_ok=True)
    for game in GAMES:
        poster_path = POSTERS / f"{game['slug']}.jpg"
        process_path = PROCESS / f"{game['slug']}.jpg"
        photo = game.get("photo") or ""
        if game.get("photo_url"):
            raw = ROOT / "assets" / "raw" / f"{game['slug']}.png"
            raw.parent.mkdir(parents=True, exist_ok=True)
            try:
                cover(game["photo_url"], raw)
                photo = str(raw)
            except Exception as error:
                print("cover failed", game["slug"], error)
        cabinet_source = None
        if photo and Path(photo).exists():
            if game.get("listed"):
                # Keep real poster proportions so arcade screens can fill edge-to-edge
                image = fit_natural(photo)
                cabinet_source = photo
            else:
                image = stamp(fit(photo), game["title"], game["credits"])
                cabinet_source = poster_path
        else:
            palettes = {
                "sea": [(8, 16, 48), (18, 40, 90), (20, 90, 140), (40, 180, 190), (255, 62, 200)],
                "run": [(16, 6, 28), (40, 10, 60), (255, 62, 200), (177, 75, 255), (247, 241, 255)],
                "fire": [(20, 6, 16), (60, 10, 40), (255, 70, 40), (255, 62, 200), (255, 210, 80)],
                "cat": [(24, 10, 28), (70, 20, 70), (255, 62, 200), (247, 241, 255), (177, 75, 255)],
                "dragon": [(18, 6, 12), (50, 8, 20), (180, 30, 40), (255, 62, 200), (255, 180, 60)],
                "mind": [(8, 8, 24), (30, 16, 70), (120, 60, 220), (177, 75, 255), (255, 62, 200)],
                "mosaic": [(12, 8, 20), (255, 62, 200), (177, 75, 255), (90, 220, 200), (247, 241, 255)],
                "potion": [(6, 16, 28), (10, 40, 70), (40, 200, 180), (177, 75, 255), (255, 62, 200)],
                "hive": [(16, 8, 8), (40, 16, 20), (220, 160, 80), (255, 62, 200), (247, 241, 255)],
                "hospital": [(10, 16, 28), (20, 40, 70), (80, 160, 200), (230, 240, 245), (255, 62, 200)],
                "mirror": [(8, 10, 28), (20, 24, 70), (90, 220, 255), (255, 62, 200), (247, 241, 255)],
            }
            image = stamp(pixel_scene(palettes[game["motif"]], game["motif"]), game["title"], game["credits"])
            cabinet_source = poster_path
        save_jpg(image, poster_path)
        process_photo = game.get("process_photo") or ""
        if process_photo and Path(process_photo).exists():
            shot = fit(process_photo)
            shot = ImageEnhance.Contrast(shot).enhance(1.05)
            save_jpg(stamp(shot, "PROCESS", game["title"]), process_path)
        else:
            lines = PROCESS_LINES[game["slug"]]
            save_jpg(process_card(lines, PINK), process_path)
        shot_dir = shots_root / game["slug"]
        shot_dir.mkdir(parents=True, exist_ok=True)
        for index, shot_path in enumerate(game.get("screenshots") or [], start=1):
            if not Path(shot_path).exists():
                continue
            try:
                save_jpg(fit(shot_path), shot_dir / f"{index:02d}.jpg")
            except Exception as error:
                print("screenshot failed", game["slug"], shot_path, error)
        make_qr(game["demo"], QR / f"{game['slug']}-demo.png")
        make_qr(game["download"], QR / f"{game['slug']}-download.png")
        if game.get("listed"):
            make_cabinet(cabinet_source or poster_path, CABINETS / f"{game['slug']}.png")
        print("built", game["slug"])


def page(game, index, total):
    chips = "".join(f"<li>{item}</li>" for item in game["tech"])
    lang_chips = "".join(f"<li>{item}</li>" for item in (game.get("languages") or []))
    warning = f'<p class="warn">{game["note"]}</p>' if game["note"] else ""
    nav_pool = LISTED_GAMES if game.get("listed") else GAMES
    nav_index = next((i for i, item in enumerate(nav_pool) if item["slug"] == game["slug"]), 0)
    prev_game = nav_pool[(nav_index - 1) % len(nav_pool)]
    next_game = nav_pool[(nav_index + 1) % len(nav_pool)]
    showcase = bool(game.get("showcase"))
    kicker = "Showcase work" if showcase else ("Additional work" if game.get("additional") else "Games")
    shot_dir = ROOT / "assets" / "screenshots" / game["slug"]
    shot_files = sorted(shot_dir.glob("*.jpg")) if shot_dir.exists() else []
    shots_html = "".join(
        f'<figure class="shot"><img src="/assets/screenshots/{game["slug"]}/{path.name}" alt="Screenshot from {game["title"]}."></figure>'
        for path in shot_files
    )
    if not shots_html:
        shots_html = f'<figure class="shot"><img src="/assets/process/{game["slug"]}.jpg" alt="Process / screenshot for {game["title"]}."></figure>'
    team_block = f'<p class="note"><strong>Team:</strong> {game["team"]}</p>' if game.get("team") else ""
    html = header(game["title"], "games") + f"""
  <main id="content" class="wrap game-page{" is-showcase" if showcase else " is-extra"}">
    <p class="kicker"><a href="/games.html#{("showcase" if showcase else "additional")}">{kicker}</a> · Game {index + 1:02d} / {total:02d}</p>
    <div class="page-hero">
      <h1>{game["title"]}</h1>
      <p class="meta">{game["genre"]}  ·  {game["engine"]}</p>
      <p class="credits-line">Credits: {game["credits"]}</p>
    </div>
    <figure class="poster">
      <img src="/assets/posters/{game["slug"]}.jpg" alt="Poster for {game["title"]}. Credits: {game["credits"]}.">
    </figure>
    {warning}
    <div class="tabs" role="tablist" aria-label="Project details">
      <button type="button" role="tab" id="tab-overview" aria-selected="true" aria-controls="panel-overview" data-tab="overview">Overview</button>
      <button type="button" role="tab" id="tab-gameplay" aria-selected="false" aria-controls="panel-gameplay" data-tab="gameplay">Synopsis</button>
      <button type="button" role="tab" id="tab-dev" aria-selected="false" aria-controls="panel-dev" data-tab="dev">Development</button>
      <button type="button" role="tab" id="tab-role" aria-selected="false" aria-controls="panel-role" data-tab="role">My role</button>
      <button type="button" role="tab" id="tab-media" aria-selected="false" aria-controls="panel-media" data-tab="media">Media</button>
      <button type="button" role="tab" id="tab-links" aria-selected="false" aria-controls="panel-links" data-tab="links">Demo &amp; download</button>
    </div>
    <div class="tab-panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" data-panel="overview">
      <article class="panel block">
        <h2>Project brief</h2>
        <p>{game["brief"]}</p>
      </article>
      <article class="panel block">
        <h2>Team credits</h2>
        <p>{game["credits"]}</p>
        {team_block}
      </article>
    </div>
    <div class="tab-panel" id="panel-gameplay" role="tabpanel" aria-labelledby="tab-gameplay" data-panel="gameplay" hidden>
      <article class="panel block">
        <h2>Game synopsis</h2>
        <p>{game["synopsis"]}</p>
      </article>
    </div>
    <div class="tab-panel" id="panel-dev" role="tabpanel" aria-labelledby="tab-dev" data-panel="dev" hidden>
      <article class="panel block">
        <h2>Game engine</h2>
        <p>{game["engine"]}</p>
      </article>
      <article class="panel block">
        <h2>Programming languages</h2>
        <ul class="chips">{lang_chips or "<li>N/A</li>"}</ul>
      </article>
      <article class="panel block">
        <h2>Technologies and software</h2>
        <ul class="chips">{chips}</ul>
      </article>
      <article class="panel block">
        <h2>Process work</h2>
        <figure class="process">
          <img src="/assets/process/{game["slug"]}.jpg" alt="Process image for {game["title"]}.">
        </figure>
      </article>
    </div>
    <div class="tab-panel" id="panel-role" role="tabpanel" aria-labelledby="tab-role" data-panel="role" hidden>
      <article class="panel block">
        <h2>Personal role</h2>
        <p>{game["role"]}</p>
      </article>
      <article class="panel block">
        <h2>Individual contributions</h2>
        <p>{game.get("contributions") or game["role"]}</p>
      </article>
    </div>
    <div class="tab-panel" id="panel-media" role="tabpanel" aria-labelledby="tab-media" data-panel="media" hidden>
      <article class="panel block">
        <h2>Screenshots</h2>
        <div class="shot-grid">{shots_html}</div>
      </article>
    </div>
    <div class="tab-panel" id="panel-links" role="tabpanel" aria-labelledby="tab-links" data-panel="links" hidden>
      <div class="qr-grid">
        <article class="qr-card">
          <h2>Demo video / page</h2>
          <p><a href="{game["demo"]}" target="_blank" rel="noopener noreferrer">{game["demo_label"]}</a></p>
          <img src="/assets/qr/{game["slug"]}-demo.png" alt="QR code for the {game["title"]} demo.">
        </article>
        <article class="qr-card">
          <h2>Game download</h2>
          <p><a href="{game["download"]}" target="_blank" rel="noopener noreferrer">{game["download_label"]}</a></p>
          <img src="/assets/qr/{game["slug"]}-download.png" alt="QR code for the {game["title"]} download.">
        </article>
      </div>
    </div>
    <p class="hero-actions">
      <a class="pixel-btn" href="/games.html">Back to games</a>
      <a class="pixel-btn" href="/games/{prev_game["slug"]}.html">Prev</a>
      <a class="pixel-btn" href="/games/{next_game["slug"]}.html">Next</a>
    </p>
  </main>
""" + footer()
    (ROOT / "games" / f"{game['slug']}.html").write_text(html, encoding="utf-8")


ABOUT = {
    "intro": "I'm Tiyah, a 23-year-old creative with a passion for art, design and making things that didn't exist before. I've always been someone who loves creating, experimenting with ideas and finding ways to bring the things in my head into the real world. But what I find even more exciting is that my work doesn't have to stop with me. I get to put something I've imagined out into the world for someone else to experience, interact with and hopefully connect with. Whether it's making someone feel something, see things from a different perspective, spark their curiosity or learn something new, I want what I create to leave a little something behind. There's something pretty amazing about knowing that something you made could mean something to someone else.",
    "portfolio": "Showcase work leads with Clinical Trial, Don't Forget to Say Goodbye, and Bushveld Brothers — each with poster, team credits, brief, synopsis, role, contributions, engine, languages, tech, process, screenshots, demo, and download. Additional games sit in a separate section.",
    "file": "The work sits across code, design, interface, and the story a player walks through. The skills terminal and the CV record list the study and the tools behind the showcase and additional games.",
    "who": "Who is Tiyah?",
    "headline": "The person behind the pixels",
    "role": "Game designer & developer",
    "sections": [
        {
            "title": "A little detour...",
            "copy": "My journey into game development wasn't exactly a straight line. I initially pursued a BSc in Biomedicine, spending two years exploring a completely different field before realising I wanted something that allowed me to exercise my creativity alongside my technical interests. I wanted to design, experiment, build and bring ideas to life, which eventually led me to take a leap in a completely different direction.",
            "photo": "portrait-profile.jpg",
            "caption": "Player 01",
            "layout": "photo-left",
        },
        {
            "title": "Finding my world at Vega",
            "copy": "My journey as a game developer began at Vega School, where I discovered just how much could be achieved through the combination of programming, art and design. Each year introduced me to new ways of creating interactive experiences, from developing gameplay mechanics and programming systems to crafting visual identities, immersive environments and meaningful narratives. It was where I began to understand that game development was the perfect intersection of my technical and creative interests.",
            "photo": "portrait-cafe.jpg",
            "caption": "Vega chapter",
            "layout": "photo-right",
        },
        {
            "title": "More than just a game",
            "copy": "One of the biggest things I've learnt is that games have the potential to be so much more than entertainment. They can teach, challenge perspectives, spark conversations and create emotional connections. I'm particularly drawn to the idea of creating experiences that leave players with something to think about long after they've put down the controller. Whether through storytelling, gameplay or visual communication, I believe every element of a game has the potential to say something.",
            "photo": "",
            "caption": "",
            "layout": "text-only",
        },
        {
            "title": "The best of both worlds",
            "copy": "I aspire to grow as a well-rounded game developer, with a particular interest in gameplay programming and C# development alongside UI/UX design and visual development. I'm equally fascinated by the logic behind how a game functions and the creative decisions that shape how it looks, feels and is experienced. I'm drawn to the challenge of taking an idea from its initial concept and visual direction all the way through to a fully functioning, interactive experience. Why choose between the art and the code when I can bring both together?",
            "photo": "",
            "caption": "",
            "layout": "text-only",
        },
        {
            "title": "Beyond the screen",
            "copy": "When I'm not working on a project, I'm usually finding inspiration in other games, exploring different visual styles, experimenting with creative ideas or getting carried away with a new project. I'm naturally drawn to the little details that give things personality, whether it's an interesting colour palette, a beautifully designed interface or an entire fictional world. I believe inspiration can come from just about anywhere, and I'm always collecting ideas for what I could create next.",
            "photo": "",
            "caption": "",
            "layout": "text-only",
        },
    ],
}
SKILLS = [
    {"label": "CODE", "title": "Gameplay programming", "copy": "Twelve quests are written in C#. Ten use Unity, two use Windows Forms, and Charmfire uses Unreal Engine 5 with Blueprints.", "tools": "C# · Unity · Windows Forms · Unreal · Blueprints"},
    {"label": "DESIGN", "title": "Game design", "copy": "The quest pages record the rules and goals for Bushveld Brothers, Selkie Song, No Exit, Echo's Lament, and Hive Mind.", "tools": "Rules · Levels · Player goals"},
    {"label": "UI / UX", "title": "UI and UX", "copy": "On Bushveld Brothers, Tiyah leads the interface work. On Don't Forget to Say Goodbye, she leads design and art.", "tools": "Interface · Visual design"},
    {"label": "SYSTEMS", "title": "Systems", "copy": "Selkie Song includes a player state machine. Charmfire uses state objects for movement and combat, and strategy objects for bot decisions.", "tools": "State machines · Blueprints"},
    {"label": "STORY", "title": "Storytelling", "copy": "Don't Forget to Say Goodbye, Selkie Song, Echo's Lament, and Hive Mind are built around a story the player acts out.", "tools": "Narrative games"},
    {"label": "TOOLS", "title": "Tools", "copy": "The quest pages also use Python, Git, and the engines listed above. This site is the public record of that work.", "tools": "Python · Git · Unity · Unreal"},
]
CV_ABOUT = (
    "A creative and analytical individual with a background in game and software development, "
    "digital design and web development. Passionate about combining technology, creativity and "
    "problem-solving to create engaging digital experiences."
)
CV_ROLES = ["Game Developer", "Game Designer", "Digital Creative"]
EDUCATION = [
    ("BCIS in Game/Software Development and Design", "Vega School Bordeaux", "2024 – Present"),
    ("BSc in Biomedicine (Year 1–2)", "Eduvos Midrand", "2022–2023"),
    ("TU Delft Pre-University Mathematics and Physics", "TU Delft", "2023"),
    ("Diploma in General Science", "Alison", "2023"),
    ("Matric – Bachelor's Qualification", "St Martin's High School", "2018–2021"),
]
CV_SKILL_GROUPS = [
    ("Game Development", ["Unity", "Unreal Engine", "C#", "C++", "Twine"]),
    ("3D Modelling & Design", ["3ds Max", "Adobe Photoshop", "Canva", "Digital Illustration", "Graphic Design", "Figma", "Blender"]),
    ("Programming & Web Development", ["HTML", "Delphi", "Web Design", "Web Development"]),
    ("Data & Software", ["SQL", "MongoDB", "Microsoft Excel", "Microsoft Office Suite", "Database Management"]),
]
CV_JOBS = [
    {
        "org": "Trident Fuels (Pty) Ltd",
        "when": "2020–2023",
        "role": "Web Designer & Digital Illustrator",
        "bullets": [
            "Designed and updated the company's official website.",
            "Created digital advertisements, brochures, banners and social media posters.",
            "Worked on digital marketing and visual communication.",
        ],
    },
    {
        "org": "MTN",
        "when": "2023",
        "role": "Presentations Designer & Spreadsheet Analyst",
        "bullets": [
            "Analysed spreadsheet data.",
            "Transformed data into presentations for client meetings.",
        ],
    },
]
CV_EXTRA = {
    "org": "SERI – Socio-Economic Rights Institute of South Africa",
    "when": "2021",
    "role": "Job Shadowing",
    "bullets": [
        "Analysed legal cases and case write-ups.",
        "Attended and presented information during formal meetings.",
        "Interviewed a human rights lawyer.",
    ],
}
CV_LANGUAGES = [
    ("English", 5),
    ("Afrikaans", 5),
    ("Arabic", 1),
]
CV_CERTS = [
    ("TU Delft Pre-University Mathematics and Physics", "TU Delft · 2023"),
    ("Diploma in General Science", "Alison · 2023"),
]
CV_INTRO = CV_ABOUT
CV_FILE = "Open the digital CV page for the full player record."
CONTACT_BLURB = (
    "Have a project in mind, an interesting idea, or just want to chat about all things "
    "games and creativity? I'd love to hear from you! Whether it's a collaboration, an "
    "opportunity or simply a hello, my inbox is always open. Let's connect, exchange ideas "
    "and see what we can create together!"
)
CONTACT_EMAIL = "tiyah.singh0308@gmail.com"
CONTACT_LINKS = [
    {"label": "EMAIL", "title": "Email", "text": CONTACT_EMAIL, "href": f"mailto:{CONTACT_EMAIL}"},
    {"label": "GITHUB", "title": "GitHub", "text": "github.com/TiyahSingh", "href": "https://github.com/TiyahSingh"},
    {"label": "LINKEDIN", "title": "LinkedIn", "text": "LinkedIn", "href": "https://www.linkedin.com/in/tiyah-singh-906352236/"},
]
CONTACT_SOCIALS = [
    {"label": "LinkedIn", "href": "https://www.linkedin.com/in/tiyah-singh-906352236/", "icon": "/assets/brand/social/linkedin.png?v=2"},
    {"label": "itch.io", "href": "https://tiyahsingh.itch.io/", "icon": "/assets/brand/social/itch.png?v=2"},
    {"label": "GitHub", "href": "https://github.com/TiyahSingh", "icon": "/assets/brand/social/github.png?v=2"},
    {"label": "Email", "href": f"mailto:{CONTACT_EMAIL}", "icon": "/assets/brand/social/gmail.png?v=2"},
]


def index():
    profile = {
        "about": ABOUT,
        "skills": SKILLS,
        "cv": {
            "intro": CV_ABOUT,
            "roles": CV_ROLES,
            "education": [f"{title} · {place} · {when}" for title, place, when in EDUCATION],
            "skills": {label: tools for label, tools in CV_SKILL_GROUPS},
            "jobs": [
                f"{job['org']} · {job['when']} · {job['role']}" for job in CV_JOBS
            ],
            "extra": f"{CV_EXTRA['org']} · {CV_EXTRA['when']} · {CV_EXTRA['role']}",
            "languages": [f"{name} · {level}/5" for name, level in CV_LANGUAGES],
            "certs": [f"{title} · {meta}" for title, meta in CV_CERTS],
            "download": CV_FILE,
            "achievements": [f"{title} {meta}" for title, meta in CV_CERTS],
        },
        "contact": {"blurb": CONTACT_BLURB, "links": CONTACT_LINKS},
    }
    (ROOT / "js" / "explore" / "profile.json").write_text(json.dumps(profile, indent=2), encoding="utf-8")

    def game_card(game):
        kind = "showcase" if game.get("showcase") else "extra"
        label = "Showcase" if game.get("showcase") else "Additional"
        return f"""
        <article class="game-cab game-cab--{kind}">
          <p class="game-cab__tag">{label}</p>
          <h3 class="game-cab__title">{game["title"]}</h3>
          <p class="game-cab__genre">{game["genre"]}</p>
          <div class="game-cab__machine" aria-hidden="true">
            <img class="game-cab__art" src="/assets/cabinets/{game["slug"]}.png" alt="">
          </div>
          <a class="game-cab__btn" href="/games/{game["slug"]}.html">Learn about game</a>
        </article>"""

    showcase_cards = [game_card(game) for game in LISTED_GAMES if game.get("showcase")]
    extra_cards = [game_card(game) for game in LISTED_GAMES if game.get("additional")]
    contact_socials = "".join(
        f'<a class="contact-social" href="{item["href"]}"'
        + (' target="_blank" rel="noopener noreferrer"' if item["href"].startswith("http") else "")
        + f' aria-label="{item["label"]}">'
        + f'<img src="{item["icon"]}" alt="" width="28" height="28"><span>{item["label"]}</span></a>'
        for item in CONTACT_SOCIALS
    )

    def win(area, title, body):
        return f"""
      <section class="cv-win cv-{area}">
        <div class="cv-win__bar">
          <span class="cv-win__dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <h2 class="cv-win__title">{title}</h2>
        </div>
        <div class="cv-win__body">{body}</div>
      </section>"""

    edu_items = "".join(
        f"<li><strong>{title}</strong><em>{place}</em><span>{when}</span></li>"
        for title, place, when in EDUCATION
    )
    skill_blocks = "".join(
        f'<div class="cv-skill-group"><h3>{label}</h3><div class="cv-chips">'
        + "".join(f"<span>{tool}</span>" for tool in tools)
        + "</div></div>"
        for label, tools in CV_SKILL_GROUPS
    )
    job_blocks = "".join(
        f"""
        <article class="cv-job">
          <div class="cv-job__head"><strong>{job["org"]}</strong><time>{job["when"]}</time></div>
          <p class="cv-job__role">{job["role"]}</p>
          <ul>{"".join(f"<li>{b}</li>" for b in job["bullets"])}</ul>
        </article>"""
        for job in CV_JOBS
    )
    extra_block = f"""
        <article class="cv-job">
          <div class="cv-job__head"><strong>{CV_EXTRA["org"]}</strong><time>{CV_EXTRA["when"]}</time></div>
          <p class="cv-job__role">{CV_EXTRA["role"]}</p>
          <ul>{"".join(f"<li>{b}</li>" for b in CV_EXTRA["bullets"])}</ul>
        </article>"""
    lang_rows = "".join(
        f'<div class="cv-lang"><b>{name}</b><span class="cv-bars" aria-label="{level} of 5">'
        + "".join(f'<i class="{"is-on" if i < level else ""}"></i>' for i in range(5))
        + "</span></div>"
        for name, level in CV_LANGUAGES
    )
    cert_items = "".join(
        f"<li><strong>{title}</strong><span>{meta}</span></li>" for title, meta in CV_CERTS
    )
    role_pills = "".join(f"<span>{role}</span>" for role in CV_ROLES)

    def sheet(name, nav, body):
        html = header(name, nav) + f"""
  <main id="content" class="sheet">
    {body}
  </main>
""" + footer()
        (ROOT / f"{nav}.html").write_text(html, encoding="utf-8")

    about_blocks = []
    for i, section in enumerate(ABOUT["sections"]):
        layout = section.get("layout", "text-only")
        photo = section.get("photo") or ""
        caption = section.get("caption") or ""
        media = ""
        if photo:
            media = f"""
          <figure class="about-polaroid about-polaroid-{'b' if i % 2 else 'a'}">
            <img src="/assets/about/{photo}" alt="Portrait of Tiyah Singh.">
            <figcaption>{caption}</figcaption>
          </figure>"""
        about_blocks.append(f"""
      <article class="about-chapter about-{layout}">
        {media}
        <div class="about-copy">
          <p class="about-chapter-label">Chapter {i + 1:02d}</p>
          <h2>{section["title"]}</h2>
          <p>{section["copy"]}</p>
        </div>
      </article>""")
    sheet("About", "about", f"""
    <a class="about-street-exit" id="about-street-exit" href="/explore.html?door=about" hidden aria-label="Back to the street">×</a>
    <div class="wrap about-editorial">
      <header class="about-lead">
        <div class="about-lead-copy">
          <p class="kicker">ABOUT ME</p>
          <h1>{ABOUT["who"]}</h1>
          <p class="about-lead-role">{ABOUT["role"]}</p>
          <p class="about-lead-tagline">{ABOUT["headline"]}</p>
        </div>
        <figure class="about-polaroid about-polaroid-hero">
          <img src="/assets/about/portrait-look.jpg" alt="Portrait of Tiyah Singh.">
          <figcaption>Tiyah Singh</figcaption>
        </figure>
      </header>
      <section class="about-intro-card">
        <p>{ABOUT["intro"]}</p>
      </section>
      <div class="about-chapters">
        {"".join(about_blocks)}
      </div>
    </div>
    <script>
    (function () {{
      var params = new URLSearchParams(location.search);
      var fromExplore = params.get("from") === "explore" || document.referrer.indexOf("/explore.html") !== -1;
      var exit = document.getElementById("about-street-exit");
      if (exit && fromExplore) {{
        exit.hidden = false;
        document.body.classList.add("about-from-explore");
      }}
    }})();
    </script>""")
    skills_page = header("Skill Galaxy", "skills") + """
  <a class="about-street-exit" id="about-street-exit" href="/explore.html?door=skills" hidden aria-label="Back to the street">×</a>
  <main id="content" class="galaxy-stage">
    <div class="galaxy-bg" aria-hidden="true">
      <div class="galaxy-bg__photo"></div>
      <canvas id="galaxy-stars"></canvas>
      <div class="galaxy-bg__nebula"></div>
      <div class="galaxy-bg__vignette"></div>
    </div>
    <header class="galaxy-controller" aria-label="Skills title">
      <div class="gc-shell">
        <div class="gc-dpad" aria-hidden="true"><span></span></div>
        <div class="gc-screen">
          <h1>EXPLORE MY SKILLS GALAXY</h1>
          <p>TAP A PLANET TO OPEN SKILLS</p>
        </div>
        <div class="gc-btns" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </div>
    </header>
    <div class="galaxy-system-wrap">
      <div id="galaxy-system" aria-label="Interactive skill galaxy"></div>
    </div>
    <div class="galaxy-backdrop" id="galaxy-backdrop" hidden></div>
    <div class="galaxy-panel" id="galaxy-category-panel" role="dialog" aria-modal="true" hidden></div>
    <div class="galaxy-panel" id="galaxy-skill-panel" role="dialog" aria-modal="true" hidden></div>
  </main>
  <script src="/js/skills/galaxy-data.js?v=8"></script>
  <script src="/js/skills/galaxy.js?v=12"></script>
  <script>
  (function () {
    var params = new URLSearchParams(location.search);
    var fromExplore = params.get("from") === "explore";
    var exit = document.getElementById("about-street-exit");
    if (exit && fromExplore) {
      exit.hidden = false;
      document.body.classList.add("from-explore");
    }
  })();
  </script>
""" + footer()
    (ROOT / "skills.html").write_text(skills_page, encoding="utf-8")
    sheet("CV", "cv", f"""
    <a class="about-street-exit" id="about-street-exit" href="/explore.html?door=cv" hidden aria-label="Back to the street">×</a>
    <div class="cv-desktop">
      <span class="cv-sparkle" aria-hidden="true"></span>
      <span class="cv-sparkle" aria-hidden="true"></span>
      <span class="cv-sparkle" aria-hidden="true"></span>
      <span class="cv-sparkle" aria-hidden="true"></span>
      <div class="cv-board">
        <section class="cv-win cv-hero">
          <div class="cv-win__bar">
            <span class="cv-win__dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <p class="cv-win__title">Player Record</p>
          </div>
          <div class="cv-win__body">
            <div class="cv-hero__grid">
              <figure class="cv-hero__photo">
                <img src="/assets/about/portrait-look.jpg" alt="Portrait of Tiyah Singh." width="400" height="400">
              </figure>
              <div>
                <p class="cv-kicker">About me</p>
                <h1 class="cv-name">Tiyah Singh</h1>
                <div class="cv-roles">{role_pills}</div>
                <p class="cv-bio">{CV_ABOUT}</p>
                <p class="cv-meta">
                  <span>Johannesburg</span>
                  <a href="mailto:tiyah.singh0308@gmail.com">Email</a>
                  <a href="https://github.com/TiyahSingh" target="_blank" rel="noopener noreferrer">GitHub</a>
                  <a href="https://www.linkedin.com/in/tiyah-singh-906352236/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  <a href="https://tiyahsingh.itch.io/" target="_blank" rel="noopener noreferrer">itch.io</a>
                </p>
                <p class="cv-download-wrap">
                  <a class="cv-download" href="/resume/Tiyah-Singh-Resume.pdf" download="Tiyah-Singh-Resume.pdf">Download CV</a>
                </p>
              </div>
            </div>
          </div>
        </section>
        {win("edu", "Education", f'<ol class="cv-list" id="education">{edu_items}</ol>')}
        {win("skills", "Technical Skills", f'<div class="cv-skill-groups">{skill_blocks}</div>')}
        {win("work", "Work Experience", job_blocks)}
        {win("extra", "Additional Experience", extra_block)}
        {win("langs", "Languages", f'<div class="cv-lang-row">{lang_rows}</div>')}
        {win("certs", "Certifications", f'<ul class="cv-list" id="awards">{cert_items}</ul>')}
      </div>
    </div>
    <script>
    (function () {{
      var params = new URLSearchParams(location.search);
      var fromExplore = params.get("from") === "explore" || document.referrer.indexOf("/explore.html") !== -1;
      var exit = document.getElementById("about-street-exit");
      if (exit && fromExplore) {{
        exit.hidden = false;
        document.body.classList.add("from-explore");
      }}
    }})();
    </script>""")
    sheet("Games", "games", f"""
    <div class="wrap games-page">
      <p class="kicker">PORTFOLIO GAMES</p>
      <h1>Games</h1>
      <p class="section-intro zone-blurb">Pick a cabinet, then tap <strong>Learn about game</strong> for the full project page.</p>
      <section id="showcase" class="games-section">
        <h2 class="games-section__title">Showcase work</h2>
        <p class="games-section__blurb">Clinical Trial, Don't Forget to Say Goodbye, and Bushveld Brothers.</p>
        <div class="arcade-floor arcade-floor--showcase">
          {"".join(showcase_cards)}
        </div>
      </section>
      <section id="additional" class="games-section games-section--extra">
        <h2 class="games-section__title">Additional work</h2>
        <p class="games-section__blurb">Selkie Song, Charmfire, and Noesis.</p>
        <div class="arcade-floor arcade-floor--extra">
          {"".join(extra_cards)}
        </div>
      </section>
    </div>""")
    sheet("Contact", "contact", f"""
    <a class="about-street-exit" id="about-street-exit" href="/explore.html?door=contact" hidden aria-label="Back to the street">×</a>
    <div class="contact-stage">
      <div class="contact-layout">
        <article class="pad pad--signal">
          <div class="pad__shoulders" aria-hidden="true"><span class="pad__shoulder"></span><span class="pad__shoulder"></span></div>
          <div class="pad__shell">
            <span class="pad__grip pad__grip--l" aria-hidden="true"></span>
            <span class="pad__grip pad__grip--r" aria-hidden="true"></span>
            <div class="pad__dpad" aria-hidden="true"><span></span></div>
            <div class="pad__screen">
              <h1 class="contact-heading">Get in touch</h1>
              <img class="contact-logo" src="/assets/brand/main-logo.png" alt="Tiyah Singh" width="220" height="131">
              <p class="contact-blurb">{CONTACT_BLURB}</p>
              <nav class="contact-socials" aria-label="Social links">
                {contact_socials}
              </nav>
            </div>
            <div class="pad__btns" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
        </article>
        <article class="pad pad--form">
          <div class="pad__shoulders" aria-hidden="true"><span class="pad__shoulder"></span><span class="pad__shoulder"></span></div>
          <div class="pad__shell">
            <span class="pad__grip pad__grip--l" aria-hidden="true"></span>
            <span class="pad__grip pad__grip--r" aria-hidden="true"></span>
            <div class="pad__dpad" aria-hidden="true"><span></span></div>
            <div class="pad__screen">
              <h2 class="contact-form-title">Send a message</h2>
              <form class="contact-form" id="contact-form" data-email="{CONTACT_EMAIL}" novalidate>
                <div class="contact-form__row">
                  <div class="contact-field">
                    <label for="first_name">First name <span>*</span></label>
                    <input id="first_name" name="first_name" type="text" autocomplete="given-name" required placeholder="First name">
                  </div>
                  <div class="contact-field">
                    <label for="last_name">Last name</label>
                    <input id="last_name" name="last_name" type="text" autocomplete="family-name" placeholder="Last name">
                  </div>
                </div>
                <div class="contact-form__row">
                  <div class="contact-field">
                    <label for="email">Email <span>*</span></label>
                    <input id="email" name="email" type="email" autocomplete="email" required placeholder="you@email.com">
                  </div>
                  <div class="contact-field">
                    <label for="phone">Phone</label>
                    <input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="Optional">
                  </div>
                </div>
                <div class="contact-field contact-field--full">
                  <label for="message">Write a message</label>
                  <textarea id="message" name="message" rows="6" placeholder="Say hi, ask about a game, or pitch a collab…"></textarea>
                </div>
                <div class="pad__startrow" aria-hidden="true"><span class="pad__pill"></span><span class="pad__pill"></span></div>
                <button class="contact-submit" type="submit">Send</button>
                <p class="contact-note" id="contact-note" hidden></p>
              </form>
            </div>
            <div class="pad__btns" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
        </article>
      </div>
    </div>
    <script src="/js/contact.js?v=2"></script>
    <script>
    (function () {{
      var params = new URLSearchParams(location.search);
      var fromExplore = params.get("from") === "explore" || document.referrer.indexOf("/explore.html") !== -1;
      var exit = document.getElementById("about-street-exit");
      if (exit && fromExplore) {{
        exit.hidden = false;
        document.body.classList.add("from-explore");
      }}
    }})();
    </script>""")

    home = header("", "home") + """
  <main id="content" class="world">
    <section class="world-stage" aria-label="Map of Tiyah's world">
      <div class="world-stars" aria-hidden="true"></div>
      <div class="world-copy gba-shell">
        <span class="gba-heart gba-heart-tl" aria-hidden="true">♥</span>
        <span class="gba-heart gba-heart-tr" aria-hidden="true">♥</span>
        <div class="gba-screen">
          <p class="gba-kicker">PLAYER 01</p>
          <div class="gba-title-row">
            <h1>TIYAH SINGH</h1>
            <a class="pixel-btn world-start" href="/explore.html">PRESS START</a>
          </div>
          <p class="gba-role">GAME DESIGNER &amp; DEVELOPER</p>
          <p class="gba-bio">Hi, I’m Tiyah, a game designer and developer who decided one creative outlet was not enough. My game world blends gameplay programming, systems design, UI/UX digital art and storytelling, allowing me to see an idea beyond what it could look like and understand how to make it work. I exist in a space between programmer and artist, using code to give my ideas structure and creativity to give them a soul. Games let me turn the art existing in my head into worlds others can inhabit and experience mentally, emotionally, psychologically and intellectually.</p>
          <p class="gba-bio gba-cta">Step into my world and explore what I create.</p>
          <nav class="world-menu" aria-label="World destinations">
            <a href="/explore.html"><span>&#9654;</span> EXPLORE</a>
            <a href="/explore.html#explore/games">GAMES</a>
            <a href="/explore.html?door=about">ABOUT</a>
            <a href="/explore.html?door=skills">SKILLS</a>
            <a href="/explore.html?door=cv">CV</a>
            <a href="/explore.html?door=contact">CONTACT</a>
          </nav>
        </div>
        <div class="gba-controls" aria-hidden="true">
          <span class="gba-dpad"></span>
          <span class="gba-speaker"></span>
          <span class="gba-buttons"><i></i><i></i><i></i><i></i></span>
        </div>
      </div>
      <div class="world-map-frame">
        <div class="map-controller" role="group" aria-label="World map title">
          <div class="map-controller-shoulders" aria-hidden="true">
            <span></span><span></span>
          </div>
          <div class="map-controller-shell">
            <div class="map-controller-dpad" aria-hidden="true"><span></span></div>
            <div class="map-controller-screen">
              <p class="map-controller-kicker">WORLD MAP</p>
              <h2 class="map-controller-title">Travel through my world</h2>
              <p class="map-controller-sub">Drag to look · click a marker to enter</p>
            </div>
            <div class="map-controller-btns" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
        </div>

        <div class="world-art" aria-hidden="true"></div>
        <div id="world-map" class="world-canvas" role="img" aria-label="Floating neon city map. Drag to look around. Click a glowing marker to open that page."></div>
        <div class="world-veil" aria-hidden="true"></div>
        <div id="world-pins" class="world-pins"></div>
        <p class="world-hearts" aria-hidden="true">♥ ♥ ♥ · LVL 01</p>
      </div>
    </section>
  </main>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
    }
  }
  </script>
  <script type="module" src="/js/home/world-map.js?v=36"></script>
  <script>
  if (location.hash === "#play" || location.hash.indexOf("#explore/") === 0) {
    location.replace("/explore.html" + location.hash);
  }
  </script>
""" + footer()
    explore = header("Explore", "play") + """
  <main id="content">
    <section class="explore" id="play">
      <div id="explore-root" aria-label="A neon arcade street. Tap the road to walk, use the on-screen pad, or WASD on a keyboard."></div>
      <p class="explore-hud is-intro">ARROWS MOVE. TAP THE ROAD TO WALK. HOVER A DOORWAY FOR ENTER.</p>
      <button type="button" class="explore-act" id="explore-act" hidden>Enter</button>
      <div class="explore-pad" id="explore-pad" aria-label="Movement pad">
        <button type="button" class="explore-pad__btn explore-pad__up" data-dir="forward" aria-label="Move forward">▲</button>
        <button type="button" class="explore-pad__btn explore-pad__left" data-dir="left" aria-label="Move left">◀</button>
        <button type="button" class="explore-pad__btn explore-pad__core" tabindex="-1" aria-hidden="true"></button>
        <button type="button" class="explore-pad__btn explore-pad__right" data-dir="right" aria-label="Move right">▶</button>
        <button type="button" class="explore-pad__btn explore-pad__down" data-dir="back" aria-label="Move back">▼</button>
      </div>
    </section>
  </main>
  <dialog class="help" id="help">
    <p class="kicker">CONTROLS</p>
    <h2>How to play</h2>
    <p>On a phone or tablet, tap the road to walk or hold the on-screen pad. Tap a glowing doorway, then tap Enter. On a keyboard, use arrows or WASD, and press Enter or E near a door.</p>
    <form method="dialog"><button class="pixel-btn" type="submit">Close</button></form>
  </dialog>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
    }
  }
  </script>
  <script type="module" src="/js/explore/main.js?v=31"></script>
""" + footer()
    (ROOT / "index.html").write_text(home, encoding="utf-8")
    (ROOT / "explore.html").write_text(explore, encoding="utf-8")
    (ROOT / "404.html").write_text(header("Signal lost") + """
  <main id="content" class="wrap page-hero">
    <p class="kicker">ERROR 404</p>
    <h1>SIGNAL LOST</h1>
    <p class="lede">That level is not on the cartridge. Return to quest select.</p>
    <p><a class="pixel-btn" href="/">Continue</a></p>
  </main>
""" + footer(), encoding="utf-8")


def write_projects_json():
    payload = []
    for game in GAMES:
        payload.append({
            "slug": game["slug"],
            "title": game["title"],
            "genre": game["genre"],
            "card": game["card"],
            "role": game["role"],
            "tech": game["tech"],
            "demo": game["demo"],
            "demoLabel": game["demo_label"],
            "download": game["download"],
            "downloadLabel": game["download_label"],
            "poster": f"/assets/posters/{game['slug']}.jpg",
            "showcase": bool(game.get("showcase")),
            "credits": game.get("credits", ""),
        })
    (ROOT / "js" / "explore" / "projects.json").write_text(
        json.dumps(payload, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    build_images()
    for i, game in enumerate(GAMES):
        page(game, i, len(GAMES))
    index()
    write_projects_json()
    print("site written")
