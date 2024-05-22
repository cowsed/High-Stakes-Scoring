
const RED_RINGS = 24;
const BLUE_RINGS = 24;
const NUM_MOBILE_GOALS = 5

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

function newMobileGoal(id) {
  el = document.createElement('div');
  el.setAttribute('class', 'stake mobile_goal')
  el.id = 'mobile_goal_' + id
  //   el.draggable = true
  //   el.ondragstart = 'drag(event)'
  el.setAttribute('ondragover', 'allowDropRing(event)')
  el.setAttribute('ondrop', 'dropRing(event)')
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


function score_stake(el, is_doubled, is_negated) {
  dist = new ScoreDist(0, 0)
  modifier = 1
  if (is_doubled) {
    modifer = 2
  }
  if (is_negated) {
    modifier = -1
  }
  console.log('scoring', el)


  var first_el = true;
  for (const ring of el.childNodes) {
    if (!ring.classList.contains('ring')) {
      console.log('not ring');
      continue;
    }
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

  return dist;
}

function score_mogos() {
  scores = new ScoreDist(0, 0);
  document.querySelectorAll('.mobile_goal')
      .forEach(mogo => {scores = scores.add(score_stake(mogo, false, false))})

  return scores;
}

function score_alliance() {
  scores = new ScoreDist(0, 0);
  document.querySelectorAll('.alliance_stake')
      .forEach(stake => {scores = scores.add(score_stake(stake, false, false))})

  return scores;
}


function score_neutral() {
  scores = new ScoreDist(0, 0);
  document.querySelectorAll('.neutral_stake')
      .forEach(stake => {scores = scores.add(score_stake(stake, false, false))})

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
  console.log('calc');

  const output = {
    'climb': new ScoreDist(0, 0),
    'alliance_stakes': score_alliance(),
    'neutral_stakes': score_neutral(),
    'mobile_goals': score_mogos(),
    'high_stake': new ScoreDist(0, 0),
    'auto': get_auto_points(),
  };
  total = new ScoreDist(0, 0);
  for (const [key, value] of Object.entries(output)) {
    output_cells[key].apply_points(value)
    total = total.add(value)
  }
  total_cells.apply_points(total)
}