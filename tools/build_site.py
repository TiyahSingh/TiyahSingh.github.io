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
for folder in (POSTERS, PROCESS, QR, ROOT / "games"):
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


def fit(src, size=(1400, 788)):
    image = Image.open(src).convert("RGB")
    image.thumbnail(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, INK)
    x = (size[0] - image.width) // 2
    y = (size[1] - image.height) // 2
    canvas.paste(image, (x, y))
    return canvas


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
        "engine": "Unity · C#",
        "card": "A short 3D patrol where you read spoor, rescue wildlife, and detain poachers.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Bushveld Brothers is a short 3D ranger game set in the South African bushveld. You patrol, follow tracks, rescue wildlife, and stop poachers before the clock runs out. The ending is an arrest, not a kill.",
        "brief": "The project began as a YellowDot game-jam prototype and was then developed as a Starr Studios commercial concept: a premium, short Steam adventure about hunting the hunters. The brief asked for a readable patrol loop, a South African setting, and a product that could be pitched with a game design document, interface system, and store artwork.",
        "role": "Tiyah Singh produced the project and led the interface work. On the studio roster she is project manager, lead UI/UX designer, gameplay programmer, and documentation lead. She kept the schedule, designed menus and HUD flow, implemented gameplay in C#, and wrote the production records.",
        "tech": ["Unity", "C#", "3D level art", "UI style guide", "GitHub"],
        "demo": "https://www.canva.com/design/DAGwcwvyT20/CFXTwt7RG_zKjoMCMYbHSQ/edit",
        "demo_label": "Pitch presentation",
        "download": "https://github.com/DavidBarker05/Games-For-Africa",
        "download_label": "Unity project on GitHub",
        "photo": r"C:\Users\User\Desktop\GADS\GADS_Project\Part2\assets\key_art_wide.png",
        "process_photo": r"C:\Users\User\Desktop\GADS\GADS_Project\Part2\pdf_images\storyboard_contact_sheet.jpg",
        "motif": "sea",
        "note": "",
    },
    {
        "slug": "dont-forget-to-say-goodbye",
        "title": "Don't Forget to Say Goodbye",
        "genre": "Narrative horror",
        "engine": "Unity 6 · C#",
        "card": "A haunted manor, ritual puzzles, and a Ouija board answered by a local language model.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "You explore a haunted house, solve ritual puzzles, and speak to a spirit through a Ouija board. A local Llama 3.2 model writes the opening story and very short board replies. Scripted gates keep the important answers stable. Saying GOODBYE closes the session.",
        "brief": "The GADS brief was a haunted-house game with a local language model inside the play experience. The board had to stay safe and consistent, so free replies are short, critical plot answers are authored in advance, and the model never calls a cloud API.",
        "role": "Tiyah led design and art. She shaped the occult interface, the ritual props, and the visual language of the manor.",
        "tech": ["Unity 6 (6000.4.1f1)", "C#", "Ollama", "Llama 3.2", "Whisper.unity", "TextMesh Pro"],
        "demo": "https://canva.link/gj0ke405qwcgs47",
        "demo_label": "Showcase video",
        "download": "https://github.com/DavidBarker05/Ouija-Game",
        "download_label": "Unity project on GitHub",
        "photo": r"C:\Users\User\Desktop\GADS\DFTSGgif.gif",
        "process_photo": r"C:\Users\User\Downloads\DFTSG UI Elements\BloodRune1Image.png",
        "motif": "fire",
        "note": "This game is fiction about grief, death, and the occult. It is aimed at players 16 and older.",
    },
    {
        "slug": "selkie-song",
        "title": "Selkie Song",
        "genre": "Folklore platformer",
        "engine": "Unity 6 · C#",
        "card": "A selkie crosses broken docks, collecting the pieces of her stolen skin.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "A sailor stole a selkie's skin, trapping her in human form. Fragments of that skin are scattered across broken docks above the ocean. You jump from platform to platform, collect the fragments, and use checkpoints. Falling into the water costs a life. When the skin is whole again, she can return to the sea.",
        "brief": "Selkie Song is the GADE7321 group project. The brief was a playable narrative platformer with dialogue, collectibles, checkpoints, and enemy patterns, documented with schedules, code references, and individual presentations.",
        "role": "Tiyah developed the Unity project. The build includes a player state machine, dialogue, checkpoints, collectibles, moving platforms, and patrolling enemies. Her reports and presentations are linked from the repository.",
        "tech": ["Unity 6 (6000.0.38f1)", "C#", "State machine", "Dialogue data", "NavMesh enemies"],
        "demo": "https://canva.link/55m6gytbp41gzc6",
        "demo_label": "Video presentation",
        "download": "https://github.com/TiyahSingh/GADE7321POE",
        "download_label": "Project repository",
        "photo": "",
        "process_photo": r"C:\Users\User\Downloads\Selkie Song UI Assets (1)\playbutton.png",
        "motif": "sea",
        "note": "",
    },
    {
        "slug": "clinical-trial",
        "title": "Clinical Trial",
        "genre": "Hospital simulation",
        "engine": "Unity",
        "card": "Run an under-resourced public clinic by switching between four hospital jobs.",
        "credits": "Tiyah Singh",
        "team": "",
        "synopsis": "Clinical Trial puts you inside a crowded South African public clinic. You switch between manager, doctor, nurse, and janitor. Each role has its own jobs, from patient care and emergencies to cleaning and equipment, and every task spends time on the hospital clock.",
        "brief": "The WIL brief was a 3D hospital simulation about under-resourced public healthcare. Players had to feel the pressure of shortages, switch roles, and keep the clinic running through planned work and sudden emergencies.",
        "role": "Tiyah worked on the clinic simulation. She also published Pharmacist Mini Game, a Unity pharmacy simulation of imprint checks, pill sorting, dispensing, and labelling, as related clinical gameplay.",
        "tech": ["Unity", "C#", "3D clinic scenes", "Role-based mini-games", "GitHub"],
        "demo": "https://github.com/LJ-vdZ/XBCGD7312_Clinical-Trial",
        "demo_label": "Group prototype",
        "download": "https://github.com/TiyahSingh/PharmacistMiniGame",
        "download_label": "Pharmacy mini-game",
        "photo": r"C:\Users\User\Desktop\GADS\ClinicalTrialGIF.gif",
        "process_photo": "",
        "motif": "hospital",
        "note": "The group prototype is the demo link. The pharmacy mini-game is Tiyah's public playable build from the same clinical work.",
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
        "photo": "",
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
        "photo": "",
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
    else:
        body = ""
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
  <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@600;700;800&family=Sora:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" href="/assets/brand/favicon.png" type="image/png">
  <link rel="stylesheet" href="/css/site.css?v=24">
</head>
<body{body}>
  <a class="skip" href="#content">Skip to content</a>
  <div class="scanlines" aria-hidden="true"></div>
  <header class="hud">
    <a class="logo" href="/" aria-label="Tiyah Singh home">
      <img src="/assets/brand/main-logo.png" alt="Tiyah Singh" width="230" height="230">
    </a>
    <nav class="nav" aria-label="Primary">
      {items}
    </nav>
    <button class="pixel-btn" id="sfx" type="button" aria-pressed="false">SFX OFF</button>
  </header>
  <div class="brand-strip" aria-hidden="true">
    <span class="brand-strip-mark">✦ Explore My World ✦</span>
  </div>
  <div class="marquee" aria-hidden="true"><p>INSERT COIN  ·  BUSHVELD BROTHERS  ·  SELKIE SONG  ·  DON'T FORGET TO SAY GOODBYE  ·  CLINICAL TRIAL  ·  CHARMFIRE  ·  NO EXIT  ·  ECHO'S LAMENT  ·  HIVE MIND  ·  A CAT'S TALE  ·  AQUA ALCHEMY  ·  NOESIS  ·  DREAMY MOSAICS  ·  DRAGON SLAYERS  ·  INSERT COIN  ·  BUSHVELD BROTHERS  ·  SELKIE SONG  ·  DON'T FORGET TO SAY GOODBYE  ·  </p></div>
"""


def footer():
    return """  <footer>
    <span class="footer-brand">
      <img src="/assets/brand/tiny-logo.png" alt="" width="42" height="42">
      <span>TIYAH SINGH · GAME DEVELOPER</span>
    </span>
    <span>tiyahsingh.co.za</span>
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
        if photo and Path(photo).exists():
            image = stamp(fit(photo), game["title"], game["credits"])
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
        save_jpg(image, poster_path)
        process_photo = game.get("process_photo") or ""
        if process_photo and Path(process_photo).exists():
            shot = fit(process_photo)
            shot = ImageEnhance.Contrast(shot).enhance(1.05)
            save_jpg(stamp(shot, "PROCESS", game["title"]), process_path)
        else:
            lines = PROCESS_LINES[game["slug"]]
            save_jpg(process_card(lines, PINK), process_path)
        make_qr(game["demo"], QR / f"{game['slug']}-demo.png")
        make_qr(game["download"], QR / f"{game['slug']}-download.png")
        print("built", game["slug"])


def page(game, index, total):
    chips = "".join(f"<li>{item}</li>" for item in game["tech"])
    warning = f'<p class="warn">{game["note"]}</p>' if game["note"] else ""
    prev_game = GAMES[(index - 1) % total]
    next_game = GAMES[(index + 1) % total]
    html = header(game["title"], "games") + f"""
  <main id="content" class="wrap">
    <p class="kicker"><a href="/games.html">Game {index + 1:02d} / {total:02d}</a></p>
    <div class="page-hero">
      <h1>{game["title"]}</h1>
      <p class="meta">{game["genre"]}  ·  {game["engine"]}</p>
    </div>
    <figure class="poster">
      <img src="/assets/posters/{game["slug"]}.jpg" alt="Poster for {game["title"]}. Credits: {game["credits"]}.">
    </figure>
    {warning}
    <div class="tabs" role="tablist" aria-label="Project details">
      <button type="button" role="tab" id="tab-overview" aria-selected="true" aria-controls="panel-overview" data-tab="overview">Overview</button>
      <button type="button" role="tab" id="tab-gameplay" aria-selected="false" aria-controls="panel-gameplay" data-tab="gameplay">Gameplay</button>
      <button type="button" role="tab" id="tab-dev" aria-selected="false" aria-controls="panel-dev" data-tab="dev">Development</button>
      <button type="button" role="tab" id="tab-role" aria-selected="false" aria-controls="panel-role" data-tab="role">My contributions</button>
      <button type="button" role="tab" id="tab-links" aria-selected="false" aria-controls="panel-links" data-tab="links">Links</button>
    </div>
    <div class="tab-panel" id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" data-panel="overview">
      <article class="panel block">
        <h2>Project brief</h2>
        <p>{game["brief"]}</p>
      </article>
    </div>
    <div class="tab-panel" id="panel-gameplay" role="tabpanel" aria-labelledby="tab-gameplay" data-panel="gameplay" hidden>
      <article class="panel block">
        <h2>Gameplay</h2>
        <p>{game["synopsis"]}</p>
      </article>
    </div>
    <div class="tab-panel" id="panel-dev" role="tabpanel" aria-labelledby="tab-dev" data-panel="dev" hidden>
      <article class="panel block">
        <h2>Technologies</h2>
        <ul class="chips">{chips}</ul>
      </article>
      <article class="panel block">
        <h2>Process</h2>
        <figure class="process">
          <img src="/assets/process/{game["slug"]}.jpg" alt="Process image for {game["title"]}.">
        </figure>
      </article>
    </div>
    <div class="tab-panel" id="panel-role" role="tabpanel" aria-labelledby="tab-role" data-panel="role" hidden>
      <article class="panel block">
        <h2>Role and contribution</h2>
        <p>{game["role"]}</p>
        {f'<p class="note">{game["team"]}</p>' if game["team"] else ""}
      </article>
    </div>
    <div class="tab-panel" id="panel-links" role="tabpanel" aria-labelledby="tab-links" data-panel="links" hidden>
      <div class="qr-grid">
        <article class="qr-card">
          <h2>Demo</h2>
          <p><a href="{game["demo"]}">{game["demo_label"]}</a></p>
          <img src="/assets/qr/{game["slug"]}-demo.png" alt="QR code for the {game["title"]} demo.">
        </article>
        <article class="qr-card">
          <h2>Download</h2>
          <p><a href="{game["download"]}">{game["download_label"]}</a></p>
          <img src="/assets/qr/{game["slug"]}-download.png" alt="QR code for the {game["title"]} download.">
        </article>
      </div>
    </div>
    <p class="hero-actions">
      <a class="pixel-btn" href="/games.html">Back to the arcade</a>
      <a class="pixel-btn" href="/games/{prev_game["slug"]}.html">Prev</a>
      <a class="pixel-btn" href="/games/{next_game["slug"]}.html">Next</a>
    </p>
  </main>
""" + footer()
    (ROOT / "games" / f"{game['slug']}.html").write_text(html, encoding="utf-8")


ABOUT = {
    "intro": "Game developer and designer in Johannesburg. Tiyah studies at Vega, produces and designs, and programs. On Bushveld Brothers she runs Starr Studios' schedule and interface work.",
    "portfolio": "The game pages are the final-year portfolio: what the game is, what the brief asked for, what Tiyah did, which tools were used, a process image, and a link plus QR code for the demo and the download.",
    "file": "The work sits across code, design, interface, and the story a player walks through. The skills terminal and the CV record list the study and the tools behind the thirteen games.",
}
SKILLS = [
    {"label": "CODE", "title": "Gameplay programming", "copy": "Twelve quests are written in C#. Ten use Unity, two use Windows Forms, and Charmfire uses Unreal Engine 5 with Blueprints.", "tools": "C# · Unity · Windows Forms · Unreal · Blueprints"},
    {"label": "DESIGN", "title": "Game design", "copy": "The quest pages record the rules and goals for Bushveld Brothers, Selkie Song, No Exit, Echo's Lament, and Hive Mind.", "tools": "Rules · Levels · Player goals"},
    {"label": "UI / UX", "title": "UI and UX", "copy": "On Bushveld Brothers, Tiyah leads the interface work. On Don't Forget to Say Goodbye, she leads design and art.", "tools": "Interface · Visual design"},
    {"label": "SYSTEMS", "title": "Systems", "copy": "Selkie Song includes a player state machine. Charmfire uses state objects for movement and combat, and strategy objects for bot decisions.", "tools": "State machines · Blueprints"},
    {"label": "STORY", "title": "Storytelling", "copy": "Don't Forget to Say Goodbye, Selkie Song, Echo's Lament, and Hive Mind are built around a story the player acts out.", "tools": "Narrative games"},
    {"label": "TOOLS", "title": "Tools", "copy": "The quest pages also use Python, Git, and the engines listed above. This site is the public record of that work.", "tools": "Python · Git · Unity · Unreal"},
]
EDUCATION = [
    ("2024 · first year.", "Game Development, Game Design, Game Art, and Programming Logic and Design. Passed with distinction."),
    ("2025 · second year.", "Game Development, Game Design, Game Art, Databases, and Narrative for Gaming."),
    ("2026 · final year.", "The game pages collect the games, roles, and process work for the portfolio."),
]
ACHIEVEMENTS = [
    ("Diploma in General Science.", "Alison. Completed 21 May 2023. Score 95. The course covered biology, physics, and chemistry."),
    ("Distinction, Vega, 2024.", "Game Development 1A and 1B, Game Design 1A and 1B, Game Art 1A and 1B, and Programming Logic and Design."),
]
CV_INTRO = "Bachelor of Computer and Information Sciences in Game Design and Development at Vega, The Independent Institute of Education, in Johannesburg. The degree started in 2024 and this site is the final-year showcase."
CV_FILE = "A downloadable CV file is not on the site yet. The record above is the public CV."
CONTACT_BLURB = "Johannesburg. Open to game development roles, jams, and studio collaborations."
CONTACT_LINKS = [
    {"label": "EMAIL", "title": "Email", "text": "tiyah.singh0308@gmail.com", "href": "mailto:tiyah.singh0308@gmail.com"},
    {"label": "GITHUB", "title": "GitHub", "text": "github.com/TiyahSingh", "href": "https://github.com/TiyahSingh"},
    {"label": "LINKEDIN", "title": "LinkedIn", "text": "LinkedIn", "href": "https://www.linkedin.com/in/tiyah-singh-906352236"},
]


def index():
    profile = {
        "about": ABOUT,
        "skills": SKILLS,
        "cv": {
            "intro": CV_INTRO,
            "education": [f"{title} {detail}" for title, detail in EDUCATION],
            "achievements": [f"{title} {detail}" for title, detail in ACHIEVEMENTS],
            "download": CV_FILE,
        },
        "contact": {"blurb": CONTACT_BLURB, "links": CONTACT_LINKS},
    }
    (ROOT / "js" / "explore" / "profile.json").write_text(json.dumps(profile, indent=2), encoding="utf-8")

    cards = []
    for i, game in enumerate(GAMES, start=1):
        cards.append(f"""
        <a class="cab cart" href="/games/{game["slug"]}.html">
          <span class="cab-machine">
            <span class="cab-marquee"><h3>{game["title"]}</h3></span>
            <span class="cab-screen"><img src="/assets/posters/{game["slug"]}.jpg" alt=""></span>
            <span class="cab-controls" aria-hidden="true"><span class="stick"></span><span class="coin-btn"></span><span class="coin-btn alt"></span></span>
          </span>
          <span class="cab-body">
            <p class="meta">{i:02d}  ·  {game["genre"]}</p>
            <p class="cab-copy">{game["card"]}</p>
            <span class="play-tag">INSPECT GAME</span>
          </span>
        </a>""")
    skill_html = []
    for i, skill in enumerate(SKILLS):
        skill_html.append(f"""
        <div class="skill-row">
          <button class="skill" type="button" id="skill-btn-{i}" aria-expanded="false" aria-controls="skill-{i}">{skill["title"]}</button>
          <div class="skill-panel" id="skill-{i}" role="region" aria-labelledby="skill-btn-{i}" hidden>
            <p>{skill["copy"]}</p>
            <p class="meta">{skill["tools"]}</p>
          </div>
        </div>""")
    education = "".join(f"<li><strong>{title}</strong> {detail}</li>" for title, detail in EDUCATION)
    achievements = "".join(f"<li><strong>{title}</strong> {detail}</li>" for title, detail in ACHIEVEMENTS)
    contacts = "".join(f'<p><a href="{link["href"]}">{link["text"]}</a></p>' for link in CONTACT_LINKS)

    def sheet(name, nav, body):
        html = header(name, nav) + f"""
  <main id="content" class="sheet">
    {body}
  </main>
""" + footer()
        (ROOT / f"{nav}.html").write_text(html, encoding="utf-8")

    sheet("About", "about", f"""
    <div class="wrap about-grid">
      <article class="panel player-card">
        <p class="kicker">PLAYER 01</p>
        <h1>Tiyah Singh</h1>
        <p class="zone-blurb">{ABOUT["intro"]}</p>
        <p>{ABOUT["portfolio"]}</p>
        <figure class="crt">
          <img src="/assets/portrait.jpg" alt="Portrait of Tiyah Singh.">
          <figcaption>STATUS <span class="blink">♥</span> PORTFOLIO ONLINE</figcaption>
        </figure>
      </article>
      <article class="panel">
        <h2>Player file</h2>
        <ul class="chips">
          <li>Programming</li><li>Game design</li><li>UI and UX</li><li>Story</li>
        </ul>
        <p>{ABOUT["file"]}</p>
      </article>
    </div>""")
    sheet("Skills", "skills", f"""
    <div class="wrap">
      <p class="kicker">SKILL SELECT</p>
      <h1>Skills</h1>
      <p class="section-intro zone-blurb">Choose a skill. Each one opens the tools and games already on this site.</p>
      <div class="skill-list">
        {"".join(skill_html)}
      </div>
    </div>""")
    sheet("CV", "cv", f"""
    <div class="wrap">
      <p class="kicker">PLAYER RECORD</p>
      <h1>CV</h1>
      <p class="section-intro zone-blurb">{CV_INTRO}</p>
      <div id="education">
        <h2>Education</h2>
        <ol class="levels">{education}</ol>
      </div>
      <div id="awards">
        <h2>Achievements</h2>
        <ul class="badges">{achievements}</ul>
      </div>
      <p class="note">{CV_FILE}</p>
    </div>""")
    sheet("Games", "games", f"""
    <div class="wrap">
      <p class="kicker">GAMES ARCADE</p>
      <h1>Games</h1>
      <p class="section-intro zone-blurb">Thirteen games. Open a cabinet for the poster, brief, role, tools, process, demo, and download.</p>
      <div class="arcade-floor">
        {"".join(cards)}
      </div>
    </div>""")
    sheet("Contact", "contact", f"""
    <div class="wrap contact-grid">
      <article class="panel booth">
        <p class="kicker">SIGNAL</p>
        <h1>Contact</h1>
        <p class="zone-blurb">{CONTACT_BLURB}</p>
        {contacts}
      </article>
      <article class="panel">
        <h2>Two ways in</h2>
        <p>The menu opens this page. On Home, the Contact marker opens this page. In Explore, walk through the glowing Contact doorway.</p>
      </article>
    </div>""")

    home = header("", "home") + """
  <main id="content" class="world">
    <section class="world-stage" aria-label="Map of Tiyah's world">
      <div class="world-art" aria-hidden="true"></div>
      <div id="world-map" class="world-canvas" role="img" aria-label="Floating neon city map. Drag to look around. Click a glowing marker to open that page."></div>
      <div class="world-veil" aria-hidden="true"></div>
      <div id="world-pins" class="world-pins"></div>
      <div class="world-copy gba-shell">
        <span class="gba-heart gba-heart-tl" aria-hidden="true">♥</span>
        <span class="gba-heart gba-heart-tr" aria-hidden="true">♥</span>
        <div class="gba-screen">
          <p class="gba-kicker">PLAYER 01</p>
          <h1>Welcome to<br><span>Tiyah's world</span></h1>
          <p class="gba-role">GAME DESIGNER &amp; DEVELOPER</p>
          <p class="gba-bio">Collect games. Explore my world. Get to know me. Click a glowing marker on the city, or press start to walk the neon street.</p>
          <nav class="world-menu" aria-label="World destinations">
            <a href="/explore.html"><span>&#9654;</span> Explore</a>
            <a href="/explore.html#explore/games">Games</a>
            <a href="/explore.html#explore/about">About</a>
            <a href="/explore.html#explore/skills">Skills</a>
            <a href="/explore.html#explore/cv">CV</a>
            <a href="/explore.html#explore/contact">Contact</a>
          </nav>
          <a class="pixel-btn world-start" href="/explore.html">Press Start</a>
        </div>
        <div class="gba-controls" aria-hidden="true">
          <span class="gba-dpad"></span>
          <span class="gba-speaker"></span>
          <span class="gba-buttons"><i></i><i></i><i></i><i></i></span>
        </div>
      </div>
      <p class="world-hint">Drag to look · click a marker</p>
      <p class="world-hearts" aria-hidden="true">♥ ♥ ♥ · LVL 01</p>
    </section>
  </main>
  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
    }
  }
  </script>
  <script type="module" src="/js/home/world-map.js?v=8"></script>
  <script>
  if (location.hash === "#play" || location.hash.indexOf("#explore/") === 0) {
    location.replace("/explore.html" + location.hash);
  }
  </script>
""" + footer()
    explore = header("Explore", "play") + """
  <main id="content">
    <section class="explore" id="play">
      <div id="explore-root" role="img" aria-label="A neon arcade street. Tap the road to walk, or use WASD on a keyboard."></div>
      <p class="explore-hud">Walk through a glowing doorway.</p>
      <button type="button" class="explore-act" id="explore-act" hidden>Read</button>
    </section>
  </main>
  <dialog class="help" id="help">
    <p class="kicker">CONTROLS</p>
    <h2>How to play</h2>
    <p>On a phone, tap the road to walk. On a keyboard, use arrows or WASD. Walk through a glowing doorway. When a Read button appears, tap it (or press E) to open a sign or cabinet.</p>
    <form method="dialog"><button class="pixel-btn" type="submit">Close</button></form>
  </dialog>
  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
    }
  }
  </script>
  <script type="module" src="/js/explore/main.js?v=15"></script>
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


if __name__ == "__main__":
    build_images()
    for i, game in enumerate(GAMES):
        page(game, i, len(GAMES))
    index()
    print("site written")
