class VGMatch
{
  TARGET_FRAMERATE = 1 / 60 * 1000;
  name = "my gamb";

  constructor()
  {
    this.scores = [0, 0, 0, 0];
    this.start = false
    this.previousFrame = 0;
  }

  begin = () =>
  {
    window.requestAnimationFrame(this.update);
  }

  update = (timestamp) =>
  {
    // First run
    if (!this.start)
    {
      this.start = timestamp;
      this.previousFrame = 0;
    }
    // Calculate total time and previous frame
    const totalElapsed = timestamp - this.start;
    const delta = totalElapsed - this.previousFrame;

    if (delta >= this.TARGET_FRAMERATE)
    {
      // Emit updated frame
      window.dispatchEvent(
        new CustomEvent('vgframe', {
          detail: {
            totalElapsed: totalElapsed,
            delta: delta
          }
        }));
      // Update tracking
      this.previousFrame = totalElapsed;
    }

    // Request new frame
    window.requestAnimationFrame(this.update);
  }
}


class VGPlayer
{
  PLAYBACK_RATE_RANGE = [0.1, 5.0];
  currentActionLevel = 0;
  targetPlaybackRate = 1.0;
  videoTimeProgressed = 0;
  videoDuration = 0;
  isPlaying = false;

  id = null;
  actions = {}
  videoElement = null;
  videoUrl = "";

  constructor(id)
  {
    this.id = id;
    this.actions = {}

    window.addEventListener('vgaction', this.onAction);
    window.addEventListener('vgframe', this.onFrame);
  }

  setupVideo = (videoUrl = null) =>
  {
    this.videoUrl = videoUrl;
    this.videoElement = document.querySelector(`#vg_player_${this.id}`);
    this.videoElement.src = this.videoUrl;
    this.isPlaying = true;
    this.videoElement.addEventListener("ended", this.onVideoCompleted);
    this.videoTimeTotal = this.videoElement.duration;
  }

  calcPlaybackRate = (actionLevel = null) =>
  {
    if (!actionLevel)
    {
      this.videoElement.pause();
      return 0;
    }

    let new_rate = VGUtils.scale(actionLevel, VGAction.ACTION_LEVEL_RANGE[0], VGAction.ACTION_LEVEL_RANGE[1], 0, this.PLAYBACK_RATE_RANGE[1]);
    if (new_rate <= this.PLAYBACK_RATE_RANGE[0])
    {
      this.videoElement.pause();
      // lblVideoRate.innerHTML = "0.00x";
    } else
    {
      this.videoElement.playbackRate = new_rate;
      this.playVideo();
      // lblVideoRate.innerHTML = video.playbackRate.toFixed(2) + "x";
    }
  }

  playVideo = async () =>
  {
    try
    {
      await this.videoElement.play();
      //playButton.classList.add("playing");
    } catch (err)
    {
      //playButton.classList.remove("playing");
      console.log("could not play");
    }
  }

  addAction = (newAction) =>
  {
    this.removeAction(newAction);
    this.actions[newAction.id] = newAction;
    this.actions[newAction.id].player = this.id;
  }

  removeAction = (action) =>
  {
    if (this.actions.hasOwnProperty(action.id))
    {
      this.actions[action.id].destroy();
      delete this.actions[action.id];
    }
  }

  destroy = () =>
  {
    window.removeEventListener('vgaction', this.actionListener);
    window.removeEventListener('vgframe', this.onFrame);
  }

  onAction = (ev) =>
  {
    if (
      ev.detail.player == this.id &&
      this.actions[ev.detail.action] &&
      this.isPlaying)
    {
      console.log("player acted ", ev.detail)
    }
  }

  onFrame = (ev) =>
  {
    if (!this.videoElement)
    {
      this.setupVideo();
    }

    if (this.videoElement.ended)
    {
      this.videoTimeProgressed = this.videoDuration;
      return;
    }

    if (!this.isPlaying)
    {
      if (!this.videoElement.paused)
      {
        this.videoElement.pause();
      }
      return;
    }

    // Define average action level across actions
    let action_lvl = 0;
    let action_count = 0;
    for (const actionId in this.actions)
    {
      action_count++;
      if (Object.hasOwnProperty.call(this.actions, actionId))
      {
        const action = this.actions[actionId];
        action_lvl = action.actionLevel;
      }
    }
    this.currentActionLevel = action_lvl;
    if (this.videoElement.currentTime >= 0)
    {
      this.videoTimeProgressed = this.videoElement.currentTime;
    }
    console.log(this.videoDuration, this.videoTimeProgressed);

    // Calc new playback rate and change it
    this.targetPlaybackRate = this.calcPlaybackRate(action_lvl);
  }

  onVideoCompleted = (ev) =>
  {
    console.log(`P${this.id + 1} video  ended`);
    this.actionLevel = 0;
    this.videoElement.pause();
    this.isPlaying = false;
  }
}


// Base class to define a basic structure for videogamb actions.
// Should not be instantiated by itself.
class VGAction
{
  static ACTION_LEVEL_RANGE = [0.0, 100.0]
  player = null;
  id = "";
  actionLevel = 0;
  incrementPerAction = 0;
  decayPerSec = 10;
  lastActionTimestamp = null;
  cooldownInMs = 50;

  constructor()
  {
    if (this.constructor == VGAction)
    {
      throw new Error("This classes cannot be instantiated on its own.");
    }
    window.addEventListener('vgframe', this.onFrame);
  }

  onFrame = (ev) =>
  {
    this.decayActionLevel(ev.detail.delta);
    // console.log("ac_lvl ", this.actionLevel);
  }

  act = (timestamp) =>
  {
    if (timestamp - this.lastActionTimestamp >= this.cooldownInMs)
    {
      // perform the action
      this.lastActionTimestamp = timestamp;
      this.actionLevel = this.calcActionLevelIncrease();
      window.dispatchEvent(new CustomEvent('vgaction', { detail: { player: this.player, action: this.id, actionLevel: this.actionLevel } }));
    }
  }

  calcActionLevelIncrease = () =>
  {
    let res = this.actionLevel + this.incrementPerAction;
    return VGUtils.clamp(res, VGAction.ACTION_LEVEL_RANGE[0], VGAction.ACTION_LEVEL_RANGE[1]);
  }


  decayActionLevel = (elapsed) =>
  {
    let res = this.actionLevel - (this.decayPerSec * 0.001 * elapsed);
    this.actionLevel = VGUtils.clamp(res, VGAction.ACTION_LEVEL_RANGE[0], VGAction.ACTION_LEVEL_RANGE[1]);
  }
}


class VGKeyUp extends VGAction
{
  constructor(player, key, increment)
  {
    super();
    this.player = player;
    this.key = key;
    this.id = `KEY_${this.key}`;
    this.incrementPerAction = increment;
    window.addEventListener("keyup", this.keyUpListener);
  }

  keyUpListener = (ev) =>
  {
    if (ev.key == this.key)
    {
      ev.preventDefault();
      this.act(Date.now());
    }
  }

  destroy = () =>
  {
    window.removeEventListener("keyup", this.keyUpListener);
  }
}


class VGUtils
{
  // from https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
  static scale(number, inMin, inMax, outMin, outMax)
  {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  static clamp(value, min, max)
  {
    let res = Math.min(max, value);
    res = Math.max(min, res);
    return res;
  }
}

