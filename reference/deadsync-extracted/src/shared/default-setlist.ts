import type { Setlist } from "./protocol";

export const DEFAULT_SETLIST: Setlist = {
  id: "dead-classics-1",
  name: "Dead Classics — Friday Night",
  songs: [
    {
      id: "friend-of-the-devil",
      title: "Friend of the Devil",
      key: "G",
      tempo: "Medium",
      notes: "Start gentle, build on the chorus. Jerry leads.",
      chart: `[G]  [C]
A lit up and the [G]boys were drinkin'
[C]The air was [G]smoky and the [Am]place was [C]loud
A [G]friend of the [C]devil is a friend of mine
If I [Am]get home be[C]fore daylight
I [G]just might get some [D]sleep to[G]night

[G]  [C]  [D]
I [G]ran into the [C]devil, babe,
He [G]loaned me [Am]twenty [C]bills
I [G]spent the night in [C]Utah
In a [Am]cave up [C]in the hills

CHORUS:
[D]Set out [C]runnin' but I [G]take my time
A [D]friend of the [C]devil is a [G]friend of mine
If I [D]get home be[C]fore daylight
I [Am]just might get some [D]sleep to[G]night

BRIDGE:  [D] → [Am] → [G]  (repeat 2x, jam here)`,
    },
    {
      id: "scarlet-begonias",
      title: "Scarlet Begonias",
      key: "B",
      tempo: "Medium-Up",
      notes: "→ Fire on the Mountain transition. Watch for the modulation.",
      chart: `[B]  [E]  [B]  [E]

As I was [B]walkin' round [E]Grosvenor Square
[B]Not a chill to the [E]winter but a nip to the air
From the [B]other direction [E]she was calling my eye
[B]It could be an [E]illusion but I might as well try
    Might as well [B]try [E]  [B]  [E]

[B]She had [E]rings on her fingers and
[B]bells on her [E]shoes
And I [B]knew without [E]askin' she was
[B]into the [E]blues

CHORUS:
[E]Once in a while you get [B]shown the light
In the [F#]strangest of places if you [E]look at it right

JAM SECTION:
[B] [E] [B] [E] — open jam, build intensity
→ TRANSITION TO FIRE ON THE MOUNTAIN: modulate to [A]`,
    },
    {
      id: "fire-on-the-mountain",
      title: "Fire on the Mountain",
      key: "A → B",
      tempo: "Medium-Up",
      notes: "Comes out of Scarlet. Lock in with the drummer on the groove.",
      chart: `[A]  [B]  [A]  [B]  (repeat — this is the whole vamp)

[A]Long distance [B]runner what you [A]standin' there for
[A]Get up get [B]out get out [A]of the door
[A]You're playin' [B]cold music [A]on the barroom floor
[A]Drowned in your [B]laughter and [A]dead to the core

CHORUS:
[A]There's a [B]fire — [A]fire on the [B]mountain
[A]There's a [B]fire — [A]fire on the [B]mountain

VAMP:
[A] [B] — ride it, feel the pocket
Bobby comps on the [A], Jerry solos over [B]
This can go for 10+ minutes. LISTEN.`,
    },
    {
      id: "eyes-of-the-world",
      title: "Eyes of the World",
      key: "E",
      tempo: "Medium-Up",
      notes: "Big open jam. Lots of room. Bobby and Jerry trade off.",
      chart: `[Emaj7]  [A/E]  (sparkly intro)

Right out[Emaj7]side this lazy [A]summer home
You ain't [Emaj7]got time to call your [A]soul a critic, no
Right out[Emaj7]side the lazy [A]gate of winter's summer home
[B]Wonderin' where the [A]nut-thatch winters
[Emaj7]Wings a mile long just [A]carried the bird away

CHORUS:
[Emaj7]Wake up to find out [A]that you are the
[Emaj7]eyes of the [A]world
The [B]heart has its [A]beaches, its [Emaj7]homeland and
[A]thoughts of its own

JAM:
[Emaj7] [A] — open, expansive
Think major-key bliss. This is the sunrise jam.
Let the music breathe. Space between the notes.`,
    },
    {
      id: "ripple",
      title: "Ripple",
      key: "G",
      tempo: "Slow-Medium",
      notes: "Acoustic feel. Beautiful closer. Everyone sing the harmonies.",
      chart: `[G]  [C]

If my [G]words did glow with the [C]gold of sunshine
And my [G]tunes were played on the harp un[C]strung
Would you [G]hear my voice come through the [C]music
Would you [Am]hold it [D]near as it were your [G]own?

It's a [G]hand-me-down, the [C]thoughts are broken
[G]Perhaps they're better left un[C]sung
I [G]don't know, don't really [C]care
[Am]Let there be [D]songs to fill the [G]air

CHORUS:
[Am]Ripple in still [D]water
When there [G]is no pebble [C]tossed
Nor [A]wind to [D]blow [G]

OUTRO: La da da da... [G] [C] [G]
(Everyone sings — let it ring out)`,
    },
    {
      id: "casey-jones",
      title: "Casey Jones",
      key: "C",
      tempo: "Medium-Up (driving)",
      notes: "Big singalong energy. Fun closer for Set 1.",
      chart: `[C]  [F]  [C]

[C]Drivin' that train, [F]high on cocaine
[C]Casey Jones you better [G]watch your speed
[C]Trouble ahead, [F]trouble behind
[C]And you know that [G]notion just crossed my [C]mind

[F]This old engine [C]makes it on time
[F]Leaves Central Sta[C]tion 'bout a quarter to nine
[F]Hits River Junc[C]tion at seventeen to
At a [G]quarter to ten you know it's travelin' again

CHORUS:
[C]Drivin' that train, [F]high on cocaine
[C]Casey Jones you better [G]watch your speed
[C]Trouble ahead, [F]trouble behind
And you [G]know that notion just crossed my [C]mind

(Build energy each verse — this is a crowd-pleaser)`,
    },
    {
      id: "truckin",
      title: "Truckin'",
      key: "E",
      tempo: "Medium shuffle",
      notes: "The anthem. Keep it loose and swinging.",
      chart: `[E]  [A]  [E]  [A]

[E]Truckin' — got my [A]chips cashed in
[E]Keep truckin' — like the [A]doodah man
[B]Together — [A]more or less in line
[E]Just keep truckin' [A]on [E]

[E]Arrows of neon and [A]flashing marquees out on Main Street
[E]Chicago, New York, [A]Detroit and it's all on the same street
[B]Your typical [A]city involved in a typical daydream
[E]Hang it up and [A]see what tomorrow [E]brings

CHORUS:
[A]Truckin' — I'm a-goin' home
[E]Whoa-oh baby, back where I belong
[A]Back home — sit down and patch my bones
And [B]get back truckin' [A]on [E]

JAM: [E] blues-rock — let it breathe, get weird`,
    },
    {
      id: "uncle-johns-band",
      title: "Uncle John's Band",
      key: "G",
      tempo: "Medium",
      notes: "Intricate picking intro. Harmonies on the chorus are essential.",
      chart: `INTRO: [G] fingerpicking pattern (Garcia style)
[G] [C] [G] [C] [G] [C] [D]

[G]Well the [C]first days are the [G]hardest days
[C]Don't you [G]worry any[Am]more [Em]
'Cause when [C]life looks like [D]Easy [G]Street
There is [Am]danger [Em]at your [D]door

[G]Think this through with [Bm]me
[C]Let me know your [D]mind
[G]Whoa-oh [D]what I want to [C]know [D]
Is [G]are you kind?

CHORUS:
[C]  [D]  [G]  [D]  [C]
God [G]damn, well I de[Am]clare
[Em]Have you [C]seen the [D]like?
Their [G]walls are built of [C]cannonballs
Their [Am]motto [D]is "Don't [G]tread on me"

(Big group vocal on "Come hear Uncle John's Band")`,
    },
  ],
};
