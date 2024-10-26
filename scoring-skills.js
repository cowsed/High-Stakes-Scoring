const RED_RINGS = 24;
const BLUE_RINGS = 11;
const NUM_MOBILE_GOALS = 5

const MAX_ALLIANCE_RINGS = 2;
const MAX_MOGO_RINGS = 6;
const MAX_NEUTRAL_RINGS = 6;
const MAX_HIGH_RINGS = 1;

const MAX_MOGO_CORNERS = 4;
var lastTotalRedRingsScored = 0;

function error_text_append(str){
  document.getElementById('error_messages').innerHTML += str + '<br>'
}

function error_text_clear(){
  document.getElementById('error_messages').innerHTML = ''
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
  //   var data = ev.dataTransfer.getData('text');
  //   el = document.getElementById(data)
  //   el.classList.remove('ghost_ring')
  recalculateAll();
}

document.addEventListener('DOMContentLoaded', () => {
  const climbSelectors = document.querySelectorAll('.climb-selector input[type="radio"]');
  const buddySelectors = document.querySelectorAll('.climb-selector input[type="checkbox"]');
  
  climbSelectors.forEach((radio) => {
      radio.addEventListener('change', () => {
          recalculateAll();
      });
  });

  buddySelectors.forEach((radio) => {
    radio.addEventListener('change', () => {
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
  var first_el = true;
  var ring_count = 0;
  var red_rings = getTotalRedRingsScored();

  for(const ring of el.childNodes) {
    if (!ring.classList.contains('ring')){
      continue;
    }
    ring_count++;

    if(ring.classList.contains('red')){
      if (first_el) {
        ramt = 3;
      } else {
        ramt = 1;
      }
      score.score += ramt;
      ring.innerHTML = ramt;
    }

    /**
     * blue rings only earn points if --
     *    scored as top ring
     *    at least one red ring scored below blue ring
     *    all red rings have been scored
     */
    if(ring.classList.contains('blue')){
      let bamt = 0;
      if(red_rings >= RED_RINGS){
        bamt = first_el ? 3 : 1;
      }
      score.score += bamt;
      ring.innerHTML = bamt.toString();
    }

    first_el = false;
  }

  if(ring_count > max_rings){
    stake_id = el.id.replaceAll('_', ' ');
    error_text_append(`${ring_count} rings on <b>${stake_id}</b> which takes ${
        max_rings} rings`)
  }

  return score;
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

  const red1Climb = parseInt(document.querySelector('input[name="red-1-climb"]:checked').value);
  const red2Climb = parseInt(document.querySelector('input[name="red-2-climb"]:checked').value);

  const redRingsOnHighStake = high_stake.querySelectorAll('.red.ring').length;

  if (redRingsOnHighStake > 0){
    if (red1Climb > 0) score.score += 2;
    if (red2Climb > 0) score.score += 2;
    if(document.getElementById('red-buddy-check').checked) score.score += 2
  }

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

  score += parseInt(document.querySelector('input[name="red-1-climb"]:checked').value);

  if(document.getElementById('red-buddy-check').checked){
    score += 2 * (parseInt(document.querySelector('input[name="red-2-climb"]:checked').value));
  }
  else{
    score += parseInt(document.querySelector('input[name="red-2-climb"]:checked').value);
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
    error_text_append(`Only ${MAX_MOGO_CORNERS} mogos can go in corners [1 per corner].`);
    mobileGoalModifiers.forEach((dropdown) => {
      if (cornerCount > MAX_MOGO_CORNERS && dropdown.value === "2") {
        dropdown.value = "1";
        cornerCount--;
      }
    });
  }

  const output = {
    'climb': calculateClimbScore(),  // Update climb score calculation
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
      output_cells[key].apply_points(value.score);  // Apply climb score directly
      total_climb_score = total_climb_score.add(value);
    } else{
      output_cells[key].apply_points(value.score);
      total_stakes_score = total_stakes_score.add(value);
    }
  }

  if(total_stakes_score.score < 0) total_stakes_score.score = 0;

  const total_score = total_stakes_score.add(total_climb_score);
  total_cells.apply_points(total_score.score);
}
