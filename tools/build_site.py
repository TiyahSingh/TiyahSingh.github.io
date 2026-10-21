"""Build the static portfolio pages, posters, and QR codes."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
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
        "credits": "Tiyah Singh  ·  Jamie-Lee Davies  ·  Barrie George Davies",
        "team": "Starr Studios: Tiyah Singh, Jamie-Lee Davies, and Barrie George Davies.",
        "synopsis": "Bushveld Brothers is a short 3D ranger game set in the South African bushveld. You patrol as Barries, follow tracks, rescue wildlife, and stop poachers before the clock runs out. The ending is an arrest, not a kill.",
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
        "credits": "David Barker  ·  Tiyah Singh",
        "team": "David Barker (design and programming) and Tiyah Singh (design and art).",
        "synopsis": "You explore a haunted house, solve ritual puzzles, and speak to a spirit through a Ouija board. A local Llama 3.2 model writes the opening story and very short board replies. Scripted gates keep the important answers stable. Saying GOODBYE closes the session.",
        "brief": "The GADS brief was a haunted-house game with a local language model inside the play experience. The board had to stay safe and consistent, so free replies are short, critical plot answers are authored in advance, and the model never calls a cloud API.",
        "role": "Tiyah led design and art. She shaped the occult interface, the ritual props, and the visual language of the manor, working with David Barker, who designed and programmed the systems.",
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
        "credits": "Tiyah Singh  ·  Jamie-Lee Davies",
        "team": "Tiyah Singh and Jamie-Lee Davies.",
        "synopsis": "A sailor stole a selkie's skin, trapping her in human form. Fragments of that skin are scattered across broken docks above the ocean. You jump from platform to platform, collect the fragments, and use checkpoints. Falling into the water costs a life. When the skin is whole again, she can return to the sea.",
        "brief": "Selkie Song is the GADE7321 group project. The brief was a playable narrative platformer with dialogue, collectibles, checkpoints, and enemy patterns, documented with schedules, code references, and individual presentations.",
        "role": "Tiyah co-developed the Unity project with Jamie-Lee Davies. The build includes a player state machine, dialogue, checkpoints, collectibles, moving platforms, and patrolling enemies. Her individual reports and presentations are linked from the repository.",
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
        "credits": "Lazjessicah van der Zee  ·  Tiyah Singh  ·  Jamie-Lee Davies  ·  Jacques Willemse",
        "team": "Lazjessicah van der Zee, Tiyah Singh, Jamie-Lee Davies, and Jacques Willemse.",
        "synopsis": "Clinical Trial puts you inside a crowded South African public clinic. You switch between manager, doctor, nurse, and janitor. Each role has its own jobs, from patient care and emergencies to cleaning and equipment, and every task spends time on the hospital clock.",
        "brief": "The WIL brief was a 3D hospital simulation about under-resourced public healthcare. Players had to feel the pressure of shortages, switch roles, and keep the clinic running through planned work and sudden emergencies.",
        "role": "Tiyah is a founding member of the four-person team. She also published Pharmacist Mini Game, a Unity pharmacy simulation of imprint checks, pill sorting, dispensing, and labelling, as related clinical gameplay.",
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
        "credits": "Tiyah Singh  ·  Jamie-Lee Davies",
        "team": "Tiyah Singh and Jamie-Lee Davies.",
        "synopsis": "Charmfire is a combat prototype in which the player sprints, fights, and can fall, while bots patrol, attack, flee, and look for health. Weapons do not share one behaviour: a pistol hits immediately, and a grenade launcher fires a projectile.",
        "brief": "The GADE brief was an Unreal Engine 5 game whose combat and AI could grow without collapsing into one giant script. The team separated actions into states and decisions into strategies so new behaviour could be added without rewriting player input.",
        "role": "Tiyah co-developed the Unreal project with Jamie-Lee Davies. Both developers filed individual documentation in the repository. The gameplay is built in Blueprints, with state objects for movement and combat and strategy objects for bot decisions.",
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
        "credits": "Tiyah Singh  ·  Jamie-Lee Davies",
        "team": "Tiyah Singh and Jamie-Lee Davies.",
        "synopsis": "No Exit is a cyberpunk endless runner, documented in development as CyberBreak. You are a rogue experiment whose energy core kills you if you stop. The road throws neon barriers, laser grids, flying cars, drones, and turrets at you. There is no finish line. The score is how far you survive.",
        "brief": "The GADE endless-runner brief asked for lane movement, jumping, sliding, escalating obstacles, bosses, and power-ups. The repository is named EndlessRunnerPOE. Tiyah's rules document sets the fail state: if the avatar stops for more than a second, the run ends.",
        "role": "Tiyah co-developed the runner with Jamie-Lee Davies and wrote the descriptive rules for the player, obstacles, bosses, power-ups, world hazards, and scoring. The repository links her individual report beside Jamie-Lee's.",
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
        "credits": "Jamie-Lee Davies  ·  Tiyah Singh  ·  Barrie-George Davies",
        "team": "Jamie-Lee Davies, Tiyah Singh, and Barrie-George Davies.",
        "synopsis": "Echo's Lament is a short grid puzzle made for a jam on the theme Echo and Reflection. You steer Narcissus. Echo moves as his opposite: up becomes down, and left becomes right. Both of them must stand on their exits at the same time. A move that saves one can trap the other.",
        "brief": "The jam brief was to turn the theme into the rule of the game, using the myth of Narcissus and Echo. Reflection is not decoration. Every input is two inputs, and some levels limit how many moves you have.",
        "role": "Tiyah is a credited author of the jam game with Jamie-Lee Davies and Barrie-George Davies. The public page lists the three of them as the contributors.",
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
        "credits": "Jamie-Lee Davies  ·  Tiyah Singh",
        "team": "Jamie-Lee Davies and Tiyah Singh.",
        "synopsis": "Hive Mind is published on itch.io as Hex Mind. You play a necromancy witch in a locked dungeon. Stand near a door, possess the skeleton bound to it, and walk that skeleton onto a pressure plate. Mana drains while you are inside a skeleton. If it runs out, you are thrown back into your own body and lose a life. Boxes can hold a plate down after you leave.",
        "brief": "The prototype brief was a first-person puzzle about possession: the witch cannot open the doors herself, so the solution is to spend mana, use the skeleton, and still escape in her own body.",
        "role": "Tiyah is a credited co-author with Jamie-Lee Davies. The GitHub project is HiveMind and the playable page is Hex Mind.",
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
        "credits": "Tiyah Singh  ·  Jamie-Lee Davies",
        "team": "Tiyah Singh and Jamie-Lee Davies.",
        "synopsis": "A Cat's Tale is a grid adventure played through a Windows Forms map. You move with WASD or the arrow keys, avoid tiles that block or hurt you, and fight grunt enemies that wander and attack when they are next to you. Health pickups restore 10 hit points. Later parts add tougher enemy types, save and load, and a guide so the rules stay readable.",
        "brief": "The GADE brief was a C# game whose later stage raised the strategic pressure: more enemies, clearer feedback, and save points so a run could be continued. The map, level, rules, and buttons all live on one form.",
        "role": "Tiyah co-wrote the game and the Part 3 report with Jamie-Lee Davies. The pair split tasks on a shared schedule. Git trouble on one machine meant commits were pushed from Jamie-Lee's computer so the existing project would not be lost.",
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
        "credits": "Tiyah Singh  ·  Jamie-Lee Davies",
        "team": "Tiyah Singh and Jamie-Lee Davies.",
        "synopsis": "Aqua Alchemy is a GADS prototype about alchemy and water, presented to a client and built in Unity. The public record of the idea is the pitch presentation. The playable project, schedule, and reference list live in the repository.",
        "brief": "The brief was a client-facing prototype: a pitch that explains the game, plus a Unity build, a project schedule, and a reference list that shows where the work came from.",
        "role": "Tiyah is a repository contributor with Jamie-Lee Davies. She shares the prototype, the pitch, and the production documents published with the project.",
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
        "credits": "Tiyah Singh  ·  Jamie-Lee Davies  ·  David Barker",
        "team": "Tiyah Singh, Jamie-Lee Davies, and David Barker.",
        "synopsis": "Noesis, also titled Depth of the Mind, is a Unity prototype aimed at mood and exploration. The project is built with horror ambience, footsteps, and a hospital environment pack, and it is documented with a code reference list.",
        "brief": "The GADS concept brief was to take an idea called Depth of the Mind and turn it into a prototype with a cited bibliography, rather than a finished commercial game.",
        "role": "Tiyah is a contributor on the Depth repository with Jamie-Lee Davies and David Barker. Her work sits in that shared prototype and its reference documentation.",
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
        "credits": "Jamie-Lee Davies  ·  Lazjessicah van der Zee",
        "team": "Jamie-Lee Davies and Lazjessicah van der Zee.",
        "synopsis": "Dreamy Mosaics is a Unity 6 level prototype. The player moves with WASD, carries a glow light, and plays toward win and lose screens. The build includes an about panel, a controls panel, brightness controls, and a mute button.",
        "brief": "The prototype brief was a small, readable level game: movement, feedback when you win or lose, and settings a player can find without leaving the level.",
        "role": "The public commit history attributes the implementation to Jamie-Lee Davies and Lazjessicah van der Zee. Tiyah is presenting the prototype with the rest of the studio's released work. This page does not invent a task split that the repository does not record.",
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
        "card": "A turn-based dragon battle built with Lazjessicah van der Zee.",
        "credits": "Tiyah Singh  ·  Lazjessicah van der Zee",
        "team": "Tiyah Singh and Lazjessicah van der Zee.",
        "synopsis": "Dragon Slayers is a Windows Forms battle. The opening form starts the fight and hands the turn to the player. The GADE project grew across three parts, from the first forms to a finished battle build, a game report, and a presentation.",
        "brief": "The GADE5121 brief was a C# Windows Forms game made in a pair, with a schedule, a reference list, a written game report, and a recorded presentation of the finished part.",
        "role": "Tiyah built the project with Lazjessicah van der Zee. Each developer kept an individual readme in the repository, and both names are on the final game report and presentation.",
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


def header(current=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{"Tiyah Singh — Game Developer" if not current else current + " — Tiyah Singh"}</title>
  <meta name="description" content="Game developer portfolio of Tiyah Singh. Selected projects, roles, and playable links.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@360;500;650&family=Press+Start+2P&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <div class="scanlines" aria-hidden="true"></div>
  <header class="hud">
    <a class="logo" href="/">TIYAH<span>SINGH</span></a>
    <nav class="nav" aria-label="Primary">
      <a href="/#work">Quests</a>
      <a href="/#about">Player</a>
      <a href="/#contact">Signal</a>
    </nav>
    <button class="pixel-btn" id="sfx" type="button" aria-pressed="false">SFX OFF</button>
  </header>
  <div class="marquee" aria-hidden="true"><p>INSERT COIN  ·  BUSHVELD BROTHERS  ·  SELKIE SONG  ·  DON'T FORGET TO SAY GOODBYE  ·  CLINICAL TRIAL  ·  CHARMFIRE  ·  NO EXIT  ·  ECHO'S LAMENT  ·  HIVE MIND  ·  A CAT'S TALE  ·  AQUA ALCHEMY  ·  NOESIS  ·  DREAMY MOSAICS  ·  DRAGON SLAYERS  ·  INSERT COIN  ·  BUSHVELD BROTHERS  ·  SELKIE SONG  ·  DON'T FORGET TO SAY GOODBYE  ·  </p></div>
"""


def footer():
    return """  <footer>
    <span>TIYAH SINGH · GAME DEVELOPER</span>
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
    html = header(game["title"]) + f"""
  <main id="content" class="wrap">
    <p class="kicker"><a href="/#work">Quest {index + 1:02d} / {total:02d}</a></p>
    <div class="page-hero">
      <h1>{game["title"]}</h1>
      <p class="meta">{game["genre"]}  ·  {game["engine"]}</p>
    </div>
    <figure class="poster">
      <img src="/assets/posters/{game["slug"]}.jpg" alt="Poster for {game["title"]}. Credits: {game["credits"]}.">
    </figure>
    {warning}
    <div class="split">
      <article class="panel block">
        <h2>Synopsis</h2>
        <p>{game["synopsis"]}</p>
      </article>
      <article class="panel block">
        <h2>Project brief</h2>
        <p>{game["brief"]}</p>
      </article>
    </div>
    <article class="panel block">
      <h2>Role and contribution</h2>
      <p>{game["role"]}</p>
      <p class="note">{game["team"]}</p>
    </article>
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
    <p class="hero-actions">
      <a class="pixel-btn" href="/games/{prev_game["slug"]}.html">Prev</a>
      <a class="pixel-btn" href="/games/{next_game["slug"]}.html">Next</a>
    </p>
  </main>
""" + footer()
    (ROOT / "games" / f"{game['slug']}.html").write_text(html, encoding="utf-8")


def index():
    cards = []
    for i, game in enumerate(GAMES, start=1):
        cards.append(f"""
        <a class="cart" href="/games/{game["slug"]}.html">
          <img src="/assets/posters/{game["slug"]}.jpg" alt="">
          <div class="cart-body">
            <p class="meta">{i:02d}  ·  {game["genre"]}</p>
            <h3>{game["title"]}</h3>
            <p>{game["card"]}</p>
            <span class="play-tag">OPEN QUEST</span>
          </div>
        </a>""")
    html = header() + f"""
  <main id="content">
    <section class="hero wrap">
      <div>
        <p class="kicker">PLAYER 1  ·  READY</p>
        <h1>TIYAH<br>SINGH</h1>
        <p class="lede">Game developer and designer in Johannesburg. I build Unity and Unreal projects, from folklore platformers and local-AI horror to ranger adventures, clinic simulations, and jam puzzles.</p>
        <div class="hero-actions">
          <a class="pixel-btn" href="#work">Start game</a>
          <a class="pixel-btn" href="https://github.com/TiyahSingh">GitHub</a>
        </div>
      </div>
      <figure class="crt">
        <img src="/assets/portrait.jpg" alt="Portrait of Tiyah Singh.">
        <figcaption>STATUS <span class="blink">■</span> PORTFOLIO ONLINE</figcaption>
      </figure>
    </section>
    <section id="work">
      <div class="wrap">
        <h2>QUEST SELECT</h2>
        <p class="section-intro">Thirteen shipped and prototype games. Open a quest for the poster, synopsis, brief, role, tools, process, demo, and download.</p>
        <div class="shelf">
          {"".join(cards)}
        </div>
      </div>
    </section>
    <section id="about">
      <div class="wrap about-grid">
        <article class="panel">
          <h2>PLAYER FILE</h2>
          <p>Tiyah Singh studies Game Design and Development at Vega in the Bachelor of Computer and Information Systems. She produces and designs as well as programs. On Bushveld Brothers she runs Starr Studios' schedule and interface work with Jamie-Lee Davies and Barrie George Davies.</p>
          <p>The quest pages follow the final-year portfolio brief: who made the game, what it is, what the brief asked for, what Tiyah did, which tools were used, a process image, and a link plus QR code for the demo and the download.</p>
        </article>
        <article class="panel">
          <h2>LOADOUT</h2>
          <ul class="chips">
            <li>Unity</li><li>Unreal Engine 5</li><li>C#</li><li>Blueprints</li>
            <li>Python</li><li>Windows Forms</li><li>Git</li><li>UI design</li>
          </ul>
        </article>
      </div>
    </section>
    <section id="contact">
      <div class="wrap contact-grid">
        <article class="panel">
          <h2>SIGNAL</h2>
          <p>For studio work, collaboration, or a build, use the links below.</p>
          <p><a href="mailto:tiyah.singh0308@gmail.com">tiyah.singh0308@gmail.com</a></p>
          <p><a href="https://github.com/TiyahSingh">github.com/TiyahSingh</a></p>
          <p><a href="https://www.linkedin.com/in/tiyah-singh-906352236">LinkedIn</a></p>
        </article>
        <article class="panel">
          <h2>NOW LOADING</h2>
          <p>Johannesburg. Open to game development roles, jams, and studio collaborations.</p>
          <p class="note">Press SFX in the top bar if you want the coin blip on clicks.</p>
        </article>
      </div>
    </section>
  </main>
""" + footer()
    (ROOT / "index.html").write_text(html, encoding="utf-8")
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
