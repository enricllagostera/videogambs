# DSPV

A system to play games by making a video play faster when you do something. Inspired by **motor karaoke**.

## Concept

1. It could be cool to load videos from any URL or YouTube
   1. However, it seems that YouTube has a very limited range of supported speeds for their player. Needs testing.
2. Save the game config as a file / text / image for sharing (it exports / import from that format);
   1. An image would be really cool and make for a cool thing to share!
3. Use the system with **beholder-detection**, so that actions could be based on markers.
   1. I really want to use this to do the nickelodeon version with a crank to watch a video.

### A possible **flow**:

1. **Setup**
   1. Pick a video
      1. [x] Option: drag n drop from local
      2. [ ] Option: paste YouTube URL
   2. Define number of players (max 4 for classic splitscreen)
      1. [ ] Each player gets a different video player shown side by side
      2. [ ] Define action for each player (e.g. keypress, mouse click)
      3. [ ] Tune each action effects (increment, decay, cooldown, actionFunction)
      4. [ ] Option: Players can write their names
2. **Play**
3. **End game**
   1. Show winner and some stats for each player (a histogram of action over time? total click counts?)
      1. Add some kind of share results button?
   2. Option: Restart match, same tuning, same video
   3. Option: Create new game, same tuning, new video
   4. Option: Create new game from scratch, default tuning, blank video

## Overview

![System overview](notes/chart.png)

## Logs

### 2022-03-27

Some work on organizing the ideas a bit more. Made a chart to think the structure and flow of the app.

### 2022-03-26

I need to figure out what tool / environment is better for this. I have a feeling that doing it in the browser will be best. Godot seems to have limited options for video playing.

- What is a minimal version of it?
  - [x] Load local video file
  - [x] One player
  - [x] Action: button click
  - [x] Show game over when video ended

As it is right now, the game expects a `assets/video.mp4` file to work.

## Meta info

I'm experimenting with using [standard-version](https://github.com/conventional-changelog/standard-version) in this project.