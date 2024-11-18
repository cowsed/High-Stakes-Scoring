const RED_RINGS = 24;
const BLUE_RINGS = 11;
const NUM_MOBILE_GOALS = 5

const MAX_ALLIANCE_RINGS = 2;
const MAX_MOGO_RINGS = 6;
const MAX_NEUTRAL_RINGS = 6;
const MAX_HIGH_RINGS = 1;

const MAX_MOGO_CORNERS = 4;

var lastTotalRedRingsScored = 0;
var red_worth_zero = false;
var appendedErrors = [];

var bottom_reds = {
  'mobile_goal_0': false,
  'mobile_goal_1': false,
  'mobile_goal_2': false,
  'mobile_goal_3': false,
  'mobile_goal_4': false,
  'neutral_stake_1': false,
  'neutral_stake_2': false,
  'red_alliance_stake': false,
  'blue_alliance_stake': false,
  'high_stake': false,
};

function error_text_append(str){
  if (!appendedErrors.includes(str)) {
    document.getElementById('error_messages').innerHTML += str + '<br>';
    appendedErrors.push(str); 
  }
}

function error_text_clear(){
  document.getElementById('error_messages').innerHTML = '';
  appendedErrors = [];
}

class Score{
  constructor(score){
    this.score = score;
  }
  apply_points(points){
    this.score.innerHTML = points;
  }
  add(other){
    return new Score(this.score + other.score);
  }
}

function ScoreFromLabel(label){
  return new Score(
      document.getElementById(label + '_red'))
}

function allowDropRing(ev){
  ev.preventDefault();
}

function dragRing(ev){
  if (ev.target == null){
    return;
  }

  ev.target.innerHTML = '0'
  ev.target.classList.add('ghost_ring')
  ev.dataTransfer.setData('text', ev.target.id);
}

function dropRing(ev){
  if(!ev.target.classList.contains('stake') &&
      !ev.target.classList.contains('ring_area')){
    return;
  }

  var max_rings;
  if(ev.target.classList.contains('mobile_goal')){
    max_rings = MAX_MOGO_RINGS;
  } else if(ev.target.classList.contains('alliance_stake')){
    max_rings = MAX_ALLIANCE_RINGS;
  } else if(ev.target.classList.contains('neutral_stake')) {
    max_rings = MAX_NEUTRAL_RINGS;
  } else if(ev.target.classList.contains('high_stake')){
    max_rings = MAX_HIGH_RINGS;
  }

  const rings_scored = ev.target.querySelectorAll('.ring').length;

  if(rings_scored >= max_rings){
    error_text_append(`Cannot add more than ${max_rings} rings to this stake.`);
    return;
  }

  ev.preventDefault();
  var data = ev.dataTransfer.getData('text');
  el = document.getElementById(data)
  el.classList.remove('ghost_ring')

  ev.target.insertBefore(el, ev.target.firstChild);
  recalculateAll();
}

function ringNotThere(ev){
  var data = ev.dataTransfer.getData('text');
  el = document.getElementById(data)
  el.classList.remove('ghost_ring')
  recalculateAll();
}

document.addEventListener('DOMContentLoaded', () => {
  const climbSelectors = document.querySelectorAll('.climb-selector select, .climb-selector input[type="checkbox"]');

  climbSelectors.forEach((input) => {
      input.addEventListener('change', () => {
          recalculateAll();
      });
  });
});

window.addEventListener('DOMContentLoaded', (event) => {
  output_cells = {
    'mobile_goals': ScoreFromLabel('score_mogo'),
    'neutral_stakes': ScoreFromLabel('score_neutral'),
    'alliance_stakes': ScoreFromLabel('score_alliance'),
    'high_stake': ScoreFromLabel('score_high'),
    'climb': ScoreFromLabel('score_climb'),
  };
  total_cells = ScoreFromLabel('score_full')

  red_ring_area = document.getElementById('red_rings_start')
  blue_ring_area = document.getElementById('blue_rings_start')

  mobile_goals_area = document.getElementById('mobile_goals_start')

  add_rings();
  add_mogos();

  recalculateAll();
})
/**
 * @param {String} HTML representing a single element.
 * @param {Boolean} flag representing whether or not to trim input whitespace,
 *     defaults to true.
 * @return {Element | HTMLCollection | null}
 */
function fromHTML(html, trim = true){
  // Process the HTML string.
  html = trim ? html.trim() : html;
  if (!html) return null;

  // Then set up a new template element.
  const template = document.createElement('template');
  template.innerHTML = html;
  const result = template.content.children;

  // Then return either an HTMLElement or HTMLCollection,
  // based on whether the input HTML had one or more roots.
  if (result.length === 1) return result[0];
  return result;
}

function newMobileGoal(id){
  el = document.createElement('div');
  el.setAttribute('class', 'stake mobile_goal')
  el.id = 'mobile_goal_' + id

  el.setAttribute('ondragover', 'allowDropRing(event)')
  el.setAttribute('ondrop', 'dropRing(event)')

  scoring_dropdown = `
    <select name="modifiers" onchange="recalculateAll()">
        <option value="1"> </option>
        <option value="2">corner</option>
    </select>
    `
  dropdown = fromHTML(scoring_dropdown, true)
  dropdown.id = el.id + '_mod';
  el.appendChild(dropdown)

  return el
}
function add_mogos(){
  for (i = 0; i < NUM_MOBILE_GOALS; i++){
    mobile_goals_area.appendChild(newMobileGoal(i))
  }
}

function newRing(id, color){
  el = document.createElement('div');
  el.setAttribute('class', color + ' ring');
  el.id = 'ring' + id;
  el.draggable = true;
  el.setAttribute('ondragstart', 'dragRing(event)');
  el.setAttribute('ondragend', 'ringNotThere(event)');
  el.innerHTML = 0;
  return el
}

function add_rings(){
  for (i = 0; i < RED_RINGS; i++){
    red_ring_area.appendChild(newRing(i, 'red'))
  }
  for (i = 0; i < BLUE_RINGS; i++){
    blue_ring_area.appendChild(newRing(i + RED_RINGS, 'blue'))
  }
}

function getTotalRedRingsScored(){
  var redRingArea = document.getElementById('red_rings_start');
  var blueRingArea = document.getElementById('blue_rings_start');

  var remainingRedRings = redRingArea.querySelectorAll('.red.ring').length;
  var remainingBlueRings = blueRingArea.querySelectorAll('.red.ring').length;

  var remainingRings = remainingRedRings + remainingBlueRings;
  var scoredRings = RED_RINGS - remainingRings;
  return scoredRings;
}

function score_stake(el, max_rings){
  var score = new Score(0);
  var first_el = false;
  var ring_count = 0;
  var red_rings = getTotalRedRingsScored();
  var has_red_below = false;
  var blue_top = false;

  for (let i = el.childNodes.length - 1; i >= 0; i--){
    const ring = el.childNodes[i];
    if (!ring.classList.contains('ring')){
      continue;
    }
    ring_count++;

    const remainingRedRings = el.querySelectorAll('.red.ring').length > 0;

    if(!remainingRedRings){
      bottom_reds[el.id] = false;
      has_red_below = false;
    }

    if(i === 0){
      first_el = true;
    }

    if(ring.classList.contains('red')){
      if(!blue_top){
        if(first_el){
          ramt = 3;
        } else {
          ramt = 1;
        }
        has_red_below = true;
      }
      else{
        ramt = 0;
        has_red_below = false;
        error_text_append('Red rings scored above blue rings earn 0 points.')
        error_text_append('Blue rings scored below red rings earn 0 points.')
      }
      
      score.score += ramt;
      ring.innerHTML = ramt;

      bottom_reds[el.id] = true;
    }

    /**
     * blue rings only earn points if --
     *    no red rings above blue ring
     *    at least one red ring scored below blue ring
     *    all red rings have been scored
     */
    if(ring.classList.contains('blue')){
      var bamt = 0;
      blue_top = true;
      if(red_rings >= RED_RINGS && bottom_reds[el.id] && has_red_below){
        bamt = first_el ? 3 : 1;
      }
      else{
        if(red_rings < RED_RINGS){
          error_text_append(`Not all red rings scored. All blue rings worth 0 until all red rings scored.`);
        }
        if(!has_red_below){
          error_text_append(`Blue rings not scored above red rings earn 0 points.`);
        }
      }
      score.score += bamt;
      ring.innerHTML = bamt.toString();
    }

    if(i === 1){
      first_el = true;
    }
  }

  for(const ring of el.childNodes){
    if(ring.classList.contains('blue')){
      if(red_ring_worth_zero()){
        var bamt = 0;
        score.score += bamt;
        ring.innerHTML = bamt.toString();
      }
    }
  }

  if(ring_count > max_rings){
    stake_id = el.id.replaceAll('_', ' ');
    error_text_append(`${ring_count} rings on <b>${stake_id}</b> which takes ${
        max_rings} rings`)
  }

  return score;
}

function red_ring_worth_zero(){
  const redRings = document.querySelectorAll('.red.ring');
  for(const ring of redRings){
    if(ring.innerHTML === '0'){
      return true;
    }
  }
  return false;
}

function score_mogos(){
  var score = new Score(0);
  document.querySelectorAll('.mobile_goal')
      .forEach(mogo => {score = score.add(score_stake(mogo, MAX_MOGO_RINGS))})

  return score;
}

function score_alliance(){
  var score = new Score(0);
  document.querySelectorAll('.alliance_stake')
      .forEach(
          stake => {
            score = score.add(score_stake(stake, MAX_ALLIANCE_RINGS))})

  return score;
}

function score_high(){
  const high_stake = document.getElementById('high_stake');
  var score = score_stake(high_stake, MAX_HIGH_RINGS);
  var score_climb = new Score(0);

  return [score, score_climb];
}

function score_neutral(){
  var score = new Score(0);
  document.querySelectorAll('.neutral_stake')
      .forEach(
          stake => {score = score.add(score_stake(stake, MAX_NEUTRAL_RINGS))})

  return score;
}

function calculateClimbScore(){
  var score = 0;

  score += parseInt(document.getElementById('red-1-climb').value);

  if(document.getElementById('red-buddy-check').checked){
    score += 2 * (parseInt(document.getElementById('red-2-climb').value));
  }
  else{
    score += parseInt(document.getElementById('red-2-climb').value);
  }

  return new Score(score);
}

function recalculateAll(){
  error_text_clear();

  const currentTotalRedRingsScored = getTotalRedRingsScored();
  if(currentTotalRedRingsScored < lastTotalRedRingsScored) {
      document.querySelectorAll('.blue.ring').forEach(blueRing => {
          blueRing.innerHTML = '0';
      });
  }

  lastTotalRedRingsScored = currentTotalRedRingsScored;

  var cornerCount = 0;
  const mobileGoalModifiers = document.querySelectorAll('.mobile_goal select');

  mobileGoalModifiers.forEach((dropdown) => {
    if(dropdown.value === "2") {
      cornerCount++;
    }
  });

  if(cornerCount > MAX_MOGO_CORNERS){
    error_text_append(`Only 1 mogo per corner.`);
    mobileGoalModifiers.forEach((dropdown) => {
      if (cornerCount > MAX_MOGO_CORNERS && dropdown.value === "2") {
        dropdown.value = "1";
        cornerCount--;
      }
    });
  }

  const cornerBonus = 5 * cornerCount;

  document.getElementById('score_mogo_corner_red').innerHTML = cornerBonus;

  const output = {
    'climb': calculateClimbScore(),
    'high_stake': score_high(),
    'alliance_stakes': score_alliance(),
    'neutral_stakes': score_neutral(),
    'mobile_goals': score_mogos(),
  };

  let total_stakes_score = new Score(0);
  let total_climb_score = new Score(0);

  for(const [key, value] of Object.entries(output)){
    if(key === 'high_stake'){
      output_cells[key].apply_points(value[0].score);
      total_stakes_score = total_stakes_score.add(value[0]);
      total_climb_score = total_climb_score.add(value[1]);
    } else if(key === 'climb'){
      output_cells[key].apply_points(value.score);
      total_climb_score = total_climb_score.add(value);
    } else{
      output_cells[key].apply_points(value.score);
      total_stakes_score = total_stakes_score.add(value);
    }
  }

  if(total_stakes_score.score < 0) total_stakes_score.score = 0;

  const total_score = total_stakes_score.add(total_climb_score).add(new Score(cornerBonus));
  total_cells.apply_points(total_score.score);
  document.getElementById('top_score_red').innerHTML = total_score.score;
}