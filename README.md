# Shrisha Sathishskumar — portfolio

A cinematic, robot-guided personal site built with vanilla HTML/CSS + Three.js
(no build step — push straight to GitHub Pages).

## File map

```
index.html      home page: hero robot, telemetry, rotating phrase, nav-on-scroll
about.html      about page + idle corner robot
projects.html   project cards + idle corner robot + scroll-walking robot
contact.html    contact links + idle corner robot
blogs.html      year-by-year blog + reading corner + idle corner robot + scroll-walking robot
css/style.css   design tokens (colors, fonts) + home page layout
css/pages.css   shared dark theme for about/projects/contact + shared robot widget styles
css/blogs.css   light "notebook" theme override for the blogs page
js/hero.js      home page: robot proximity trigger, telemetry, nav reveal, phrase cycling
js/robots.js    shared helpers: createCornerRobot(), createScrollWalkRobot()
js/blogs.js     active-year highlighting + back-to-top button
models/         put your .glb files here (see below)
```

## Models expected in `/models`

| File                  | Used on                          | Behaviour                                   |
|-----------------------|-----------------------------------|----------------------------------------------|
| `greetinggreet.glb`   | index.html (hero)                 | plays its first clip once when the cursor gets close |
| `Martelo 2.glb`       | about.html, contact.html          | loops idly in the bottom-left corner          |
| `jumpy.glb`           | projects.html                     | loops idly in the bottom-left corner          |
| `Flair.glb`           | blogs.html                        | loops idly in the bottom-left corner          |
| `walking.glb`         | projects.html, blogs.html         | walks only while the page is being scrolled   |

Swap any of these assignments by editing the `createCornerRobot(...)` /
`createScrollWalkRobot(...)` calls at the bottom of each HTML file.

## Notable interaction details

- **Hero robot**: no more timed auto-loop. `hero.js` projects the robot's
  world position into screen space every frame and compares it to the live
  cursor position; getting within ~220px triggers the greeting clip, with a
  4-second cooldown so it doesn't spam.
- **Nav reveal**: `#nav` starts hidden (`transform: translateY(-120%)`) and
  docks in as a translucent header once you scroll past ~12% of the viewport
  height, so it sits *over* the hero rather than stacking beneath it.
- **Telemetry panel**: five live clocks (India, UK, USA, Japan, UTC) plus a
  few slowly-drifting numbers — distance from the Sun, Earth's distance
  travelled today, distance to Andromeda. These are computed client-side from
  orbital-mechanics constants, not pulled from a live satellite feed — labelled
  as a "simulated live estimate" in the UI. Swap in a real API if you have one.
- **Scroll-walking robot**: `createScrollWalkRobot()` only advances the
  animation mixer while a scroll event has fired in the last 300ms, and
  drifts the canvas horizontally in step with scroll progress.
- **Blogs page**: every post is capped under 100 words, opens with a
  question, and closes on an open one. Year tabs are anchor links into
  `#y2019`–`#y2026`; `blogs.js` highlights whichever section is in view and
  reveals the back-to-top arrow after 400px of scroll.

## Before you push

- Replace the placeholder email/GitHub/LinkedIn links in `contact.html`.
- Replace the placeholder project cards in `projects.html` with real work.
- Fill in the 2020–2023 blog stubs whenever you transcribe those notebooks.
- Double-check the Tamil quote attribution wording in the reading corner —
  it's flagged as "traditionally attributed" since the exact era is genuinely
  disputed among sources.
