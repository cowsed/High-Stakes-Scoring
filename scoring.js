const RED_RINGS = 24;
const BLUE_RINGS = 24;
const NUM_MOBILE_GOALS = 5

const MAX_ALLIANCE_RINGS = 2;
const MAX_MOGO_RINGS = 6;
const MAX_NEUTRAL_RINGS = 6;
const MAX_HIGH_RINGS = 1;

function error_text_append(str) {
  document.getElementById('error_messages').innerHTML += str + '<br>'
}

function error_text_clear() {
  document.getElementById('error_messages').innerHTML = ''
}

class ScoreDist {
  constructor(red, blue) {
    this.red = red;
    this.blue = blue;
  }
  apply_points(scores) {
    this.red.innerHTML = scores.red;
    this.blue.innerHTML = scores.blue;
  }
  add(other) {
    return new ScoreDist(this.red + other.red, this.blue + other.blue);
  }
}

function ScoreDistFromLabel(label) {
  return new ScoreDist(
      document.getElementById(label + '_red'),
      document.getElementById(label + '_blue'))
}

function allowDropRing(ev) {
  ev.preventDefault();
}

function dragRing(ev) {
  if (ev.target == null) {
    return;
  }
  ev.target.innerHTML = '0'
  ev.target.classList.add('ghost_ring')
  ev.dataTransfer.setData('text', ev.target.id);
}

function dropRing(ev) {
  if (!ev.target.classList.contains('stake') &&
      !ev.target.classList.contains('ring_area')) {
    return;
  }

  var max_rings;
  if (ev.target.classList.contains('mobile_goal')) {
    max_rings = MAX_MOGO_RINGS;
  } else if (ev.target.classList.contains('alliance_stake')) {
    max_rings = MAX_ALLIANCE_RINGS;
  } else if (ev.target.classList.contains('neutral_stake')) {
    max_rings = MAX_NEUTRAL_RINGS;
  } else if (ev.target.classList.contains('high_stake')) {
    max_rings = MAX_HIGH_RINGS;
  }

  const rings_scored = ev.target.querySelectorAll('.ring').length;

  if (rings_scored >= max_rings) {
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


function ringNotThere(ev) {
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
  auto_winner_buttons = {
    'tie': document.getElementById('tie-radio'),
    'red': document.getElementById('red-radio'),
    'blue': document.getElementById('blue-radio')
  };

  auto_winner_buttons['tie'].addEventListener('click', recalculateAll);
  auto_winner_buttons['red'].addEventListener('click', recalculateAll);
  auto_winner_buttons['blue'].addEventListener('click', recalculateAll);

  output_cells = {
    'auto': ScoreDistFromLabel('score_auto'),
    'mobile_goals': ScoreDistFromLabel('score_mogo'),
    'neutral_stakes': ScoreDistFromLabel('score_neutral'),
    'alliance_stakes': ScoreDistFromLabel('score_alliance'),
    'high_stake': ScoreDistFromLabel('score_high'),
    'climb': ScoreDistFromLabel('score_climb'),
  };
  total_cells = ScoreDistFromLabel('score_full')

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
function fromHTML(html, trim = true) {
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


function newMobileGoal(id) {
  el = document.createElement('div');
  el.setAttribute('class', 'stake mobile_goal')
  el.id = 'mobile_goal_' + id

  el.setAttribute('ondragover', 'allowDropRing(event)')
  el.setAttribute('ondrop', 'dropRing(event)')


  scoring_dropdown = `
    <select name="modifiers" onchange="recalculateAll()">
        <option value="1"> </option>
        <option value="2">+</option>
        <option value='-1'>-</option>
    </select>
    `
  dropdown = fromHTML(scoring_dropdown, true)
  dropdown.id = el.id + '_mod';
  el.appendChild(dropdown)

  return el
}
function add_mogos() {
  for (i = 0; i < NUM_MOBILE_GOALS; i++) {
    mobile_goals_area.appendChild(newMobileGoal(i))
  }
}

function newRing(id, color) {
  el = document.createElement('div');
  el.setAttribute('class', color + ' ring');
  el.id = 'ring' + id;
  el.draggable = true;
  el.setAttribute('ondragstart', 'dragRing(event)');
  el.setAttribute('ondragend', 'ringNotThere(event)');
  el.innerHTML = 0;
  return el
}

function add_rings() {
  for (i = 0; i < RED_RINGS; i++) {
    red_ring_area.appendChild(newRing(i, 'red'))
  }
  for (i = 0; i < BLUE_RINGS; i++) {
    blue_ring_area.appendChild(newRing(i + RED_RINGS, 'blue'))
  }
}


function score_stake(el, max_rings) {
  dist = new ScoreDist(0, 0);
  modifier = 1;

  if (el.classList.contains('mobile_goal')) {
    modifier_el = document.getElementById(el.id + '_mod')
    mod_text = modifier_el.options[modifier_el.selectedIndex].value
    modifier = parseInt(mod_text);
  }

  var first_el = true;
  var lastRingWrongColor = false;
  var ring_count = 0;

  for (const ring of el.childNodes) {
    if (!ring.classList.contains('ring')) {
      continue;
    }
    ring_count++;

    const isRedRing = ring.classList.contains('red');
    const isBlueRing = ring.classList.contains('blue');
    const isAllianceStakeRed = el.classList.contains('red');
    const isAllianceStakeBlue = el.classList.contains('blue');

    // Check for incorrect color rings on alliance stakes
    if ((isRedRing && isAllianceStakeBlue) || (isBlueRing && isAllianceStakeRed)) {
      ring.innerHTML = '0';
      lastRingWrongColor = true;
      first_el = false;
      continue;
    }

    if (isRedRing || isBlueRing) {
      let points = first_el ? 3 : 1;
      // If the ring is underneath a wrong-color top ring, assign it 3 points.
      if (lastRingWrongColor) {
        points = 3;
      }

      if (isRedRing) {
        dist.red += points * modifier;
        ring.innerHTML = points * modifier;
      } else if (isBlueRing) {
        dist.blue += points * modifier;
        ring.innerHTML = points * modifier;
      }

      // Reset the wrong color flag after assigning the points.
      lastRingWrongColor = false;
      first_el = false;
    }
  }

  if (ring_count > max_rings) {
    stake_id = el.id.replaceAll('_', ' ');
    error_text_append(`${ring_count} rings on <b>${stake_id}</b> which takes ${
        max_rings} rings`)
  }

  return dist;
}


function score_mogos() {
  scores = new ScoreDist(0, 0);
  document.querySelectorAll('.mobile_goal')
      .forEach(mogo => {scores = scores.add(score_stake(mogo, MAX_MOGO_RINGS))})

  return scores;
}

function score_alliance() {
  scores = new ScoreDist(0, 0);
  document.querySelectorAll('.alliance_stake')
      .forEach(
          stake => {
              scores = scores.add(score_stake(stake, MAX_ALLIANCE_RINGS))})

  return scores;
}

function score_high() {
  const high_stake = document.getElementById('high_stake');
  scores = score_stake(high_stake, MAX_HIGH_RINGS)
  score_climb = new ScoreDist(0, 0)

  const red1Climb = parseInt(document.querySelector('input[name="red-1-climb"]:checked').value);
  const red2Climb = parseInt(document.querySelector('input[name="red-2-climb"]:checked').value);
  const blue1Climb = parseInt(document.querySelector('input[name="blue-1-climb"]:checked').value);
  const blue2Climb = parseInt(document.querySelector('input[name="blue-2-climb"]:checked').value);


  const redRingsOnHighStake = high_stake.querySelectorAll('.red.ring').length;
  const blueRingsOnHighStake = high_stake.querySelectorAll('.blue.ring').length;

  if (redRingsOnHighStake > 0) {
    if (red1Climb > 0) score_climb.red += 2;
    if (red2Climb > 0) score_climb.red += 2;
    if(document.getElementById('red-buddy-check').checked) score_climb.red += 2
  }
  if (blueRingsOnHighStake > 0) {
    if (blue1Climb > 0) score_climb.blue += 2;
    if (blue2Climb > 0) score_climb.blue += 2;
    if(document.getElementById('blue-buddy-check').checked) score_climb.blue += 2
  }

  return [scores, score_climb];
}

function score_neutral() {
  scores = new ScoreDist(0, 0);
  document.querySelectorAll('.neutral_stake')
      .forEach(
          stake => {scores = scores.add(score_stake(stake, MAX_NEUTRAL_RINGS))})

  return scores;
}

function get_auto_winner() {
  for (const [key, value] of Object.entries(auto_winner_buttons)) {
    if (value.checked) {
      return key;
    }
  }
  throw 'Auto winner somehow has no selection';
}

function get_auto_points() {
  return {
    'red': new ScoreDist(6, 0),
    'blue': new ScoreDist(0, 6),
    'tie': new ScoreDist(3, 3)
  }[get_auto_winner()];
}

function calculateClimbScore() {
  var redClimbScore = 0;
  var blueClimbScore = 0;

  redClimbScore += parseInt(document.querySelector('input[name="red-1-climb"]:checked').value);
  if(document.getElementById('red-buddy-check').checked){
    redClimbScore += 2 * (parseInt(document.querySelector('input[name="red-2-climb"]:checked').value));
  }
  else{
    redClimbScore += parseInt(document.querySelector('input[name="red-2-climb"]:checked').value);
  }

  blueClimbScore += parseInt(document.querySelector('input[name="blue-1-climb"]:checked').value);
  if(document.getElementById('blue-buddy-check').checked){
    blueClimbScore += 2 * (parseInt(document.querySelector('input[name="blue-2-climb"]:checked').value));
  }
  else{
    blueClimbScore += parseInt(document.querySelector('input[name="blue-2-climb"]:checked').value);
  }

  return new ScoreDist(redClimbScore, blueClimbScore);
}

function recalculateAll() {
  error_text_clear();
  
  var posCornerCount = 0;
  var negCornerCount = 0;
  const mobileGoalModifiers = document.querySelectorAll('.mobile_goal select');

  mobileGoalModifiers.forEach((dropdown) => {
    if(dropdown.value === "2") {
      posCornerCount++;
    }
  });

  mobileGoalModifiers.forEach((dropdown) => {
    if(dropdown.value === "-1") {
      negCornerCount++;
    }
  });

  if(posCornerCount > 2){
    error_text_append(`Only 1 mogo per corner.`);
    mobileGoalModifiers.forEach((dropdown) => {
      if (posCornerCount > 2 && dropdown.value === "2") {
        dropdown.value = "1";
        posCornerCount--;
      }
    });
  }

  if(negCornerCount > 2){
    error_text_append(`Only 1 mogo per corner.`);
    mobileGoalModifiers.forEach((dropdown) => {
      if (negCornerCount > 2 && dropdown.value === "-1") {
        dropdown.value = "1";
        negCornerCount--;
      }
    });
  }

  const output = {
    'climb': calculateClimbScore(),
    'high_stake': score_high(),
    'alliance_stakes': score_alliance(),
    'neutral_stakes': score_neutral(),
    'mobile_goals': score_mogos(),
    'auto': get_auto_points(),
  };

  let total_climb_auto = new ScoreDist(0, 0);
  let total_stakes = new ScoreDist(0, 0);

  for (const [key, value] of Object.entries(output)) {
    if (key === 'high_stake') {
      output_cells[key].apply_points(value[0]);  // Apply high stake score to the display
      total_stakes = total_stakes.add(value[0]); // Accumulate high stake score

      total_climb_auto = total_climb_auto.add(value[1]); // Add climbing score from high stake
      output_cells['climb'].apply_points(total_climb_auto);
    } else {
      output_cells[key].apply_points(value); // Apply other scores normally
    }

    // Assign points to the appropriate total
    if (key === 'climb' || key === 'auto') {
      total_climb_auto = total_climb_auto.add(value);
    } else {
      if (key !== 'high_stake') {
        total_stakes = total_stakes.add(value);
      }
    }
  }

  if (total_stakes.red < 0) total_stakes.red = 0;
  if (total_stakes.blue < 0) total_stakes.blue = 0;

  total = new ScoreDist(0, 0);
  total.red = total_stakes.red + total_climb_auto.red;
  total.blue = total_stakes.blue + total_climb_auto.blue;

  total_cells.apply_points(total);
  delta = total.red - total.blue;
  document.getElementById('delta_location').innerHTML = delta;
}