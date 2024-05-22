
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
  console.log('allow drop', ev)
  ev.preventDefault();
}

function dragRing(ev) {
  if (ev.target == null) {
    return;
  }
  console.log('dragging', ev.target)
  ev.target.classList.add('ghost_ring')
  ev.dataTransfer.setData('text', ev.target.id);
}

function dropRing(ev) {
  if (!ev.target.classList.contains('stake') &&
      !ev.target.classList.contains('ring_area')) {
    console.log('Doing it wrong');
    return;
  }
  console.log('dropping', data)
  ev.preventDefault();
  var data = ev.dataTransfer.getData('text');
  el = document.getElementById(data)
  el.classList.remove('ghost_ring')

  //   ev.target.appendChild(el);
  ev.target.insertBefore(el, ev.target.firstChild);
  recalculateAll();
}


function ringNotThere(ev) {
  //   var data = ev.dataTransfer.getData('text');
  //   el = document.getElementById(data)
  //   console.log('not there', data, el)
  //   el.classList.remove('ghost_ring')
  //   recalculateAll();
}

window.addEventListener('DOMContentLoaded', (event) => {
  auto_winner_buttons = {
    'tie': document.getElementById('tie-radio'),
    'red': document.getElementById('red-radio'),
    'blue': document.getElementById('blue-radio')
  };

  console.log(auto_winner_buttons)

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
    console.log('mod', mod_text)
  }

  var first_el = true;
  var ring_count = 0;
  for (const ring of el.childNodes) {
    console.log('Ring', ring)
    if (!ring.classList.contains('ring')) {
      console.log('not ring');
      continue;
    }
    ring_count++;
    if (ring.classList.contains('red')) {
      if (first_el) {
        ramt = 3;
      } else {
        ramt = 1;
      }
      dist.red += ramt * modifier;
      ring.innerHTML = ramt * modifier;
    }

    if (ring.classList.contains('blue')) {
      if (first_el) {
        bamt = 3;
      } else {
        bamt = 1;
      }
      dist.blue += bamt * modifier;
      ring.innerHTML = bamt * modifier;
    }

    first_el = false;
  }
  console.log('dist', dist)
  if (ring_count > max_rings) {
    stake_id = el.id.replace('_', ' ');
    error_text_append(
        `${ring_count} rings on ${stake_id} which takes ${max_rings} rings`)
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
  console.log('high', high_stake)
  return score_stake(high_stake, MAX_HIGH_RINGS)
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



function recalculateAll() {
  error_text_clear();

  const output = {
    'climb': new ScoreDist(0, 0),
    'alliance_stakes': score_alliance(),
    'neutral_stakes': score_neutral(),
    'mobile_goals': score_mogos(),
    'high_stake': score_high(),
    'auto': get_auto_points(),
  };

  total = new ScoreDist(0, 0);
  for (const [key, value] of Object.entries(output)) {
    output_cells[key].apply_points(value)
    total = total.add(value)
  }
  total_cells.apply_points(total)
  delta = total.red - total.blue
  document.getElementById('delta_location').innerHTML = delta
}