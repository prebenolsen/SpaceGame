// Scene/state machine for the game flow
export const SCENE = {
  LANDING: 'landing',          // entry menu: choose Tutorial or Campaign
  LEVEL_SELECT: 'level_select', // pick which level to play (replay or continue)
  LEVEL_INTRO: 'level_intro',
  PLAYING: 'playing',
  LEVEL_CLEAR: 'level_clear',
  UPGRADE: 'upgrade',
  DIED: 'died',                // lost a life, brief retry pause
  GAME_OVER: 'game_over',
};
