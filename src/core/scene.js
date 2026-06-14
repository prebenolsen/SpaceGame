// Scene/state machine for the game flow
export const SCENE = {
  LEVEL_INTRO: 'level_intro',
  PLAYING: 'playing',
  LEVEL_CLEAR: 'level_clear',
  UPGRADE: 'upgrade',
  DIED: 'died',         // lost a life, brief retry pause
  GAME_OVER: 'game_over',
};
