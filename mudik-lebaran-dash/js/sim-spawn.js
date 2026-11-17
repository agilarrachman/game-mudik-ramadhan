// sim-spawn.js — Simulasi keadilan spawn tanpa Three.js
const CONFIG = {
  SPEED_START: 18, SPEED_MAX: 52, ACCEL: 0.45,
  OBSTACLE_SPEED: 8,
  MIN_REACTION_T_START: 0.90, MIN_REACTION_T_END: 0.55, MIN_REACTION_T_MIN: 0.50,
  LANE_CHANGE_TIME: 0.15,
  OBSTACLE_MAX_LENGTH: 4.6, OBSTACLE_MARGIN: 1.2,
  DENSITY_MIN: 0.0, DENSITY_MAX: 0.4,
};

function computeMinGap(spd) {
  const relSpeed = spd - CONFIG.OBSTACLE_SPEED;
  const t = Math.max(0, Math.min(1, (spd - CONFIG.SPEED_START) / (CONFIG.SPEED_MAX - CONFIG.SPEED_START)));
  const reactionT = CONFIG.MIN_REACTION_T_START + t * (CONFIG.MIN_REACTION_T_END - CONFIG.MIN_REACTION_T_START);
  const rt = Math.max(CONFIG.MIN_REACTION_T_MIN, reactionT);
  // Worst case: laneChange = 2 (pindah 2 jalur)
  const minGapWorst = relSpeed * (CONFIG.LANE_CHANGE_TIME * 2 + rt);
  const obstacleGap = CONFIG.OBSTACLE_MAX_LENGTH + CONFIG.OBSTACLE_MARGIN;
  return Math.max(minGapWorst, obstacleGap);
}

function computeMinGapForChange(spd, laneChange) {
  const relSpeed = spd - CONFIG.OBSTACLE_SPEED;
  const t = Math.max(0, Math.min(1, (spd - CONFIG.SPEED_START) / (CONFIG.SPEED_MAX - CONFIG.SPEED_START)));
  const reactionT = CONFIG.MIN_REACTION_T_START + t * (CONFIG.MIN_REACTION_T_END - CONFIG.MIN_REACTION_T_START);
  const rt = Math.max(CONFIG.MIN_REACTION_T_MIN, reactionT);
  const minGap = relSpeed * (CONFIG.LANE_CHANGE_TIME * laneChange + rt);
  const obstacleGap = CONFIG.OBSTACLE_MAX_LENGTH + CONFIG.OBSTACLE_MARGIN;
  return Math.max(minGap, obstacleGap);
}

function chooseEmptyLane(prevEmpty, spd) {
  const t = Math.max(0, Math.min(1, (spd - CONFIG.SPEED_START) / (CONFIG.SPEED_MAX - CONFIG.SPEED_START)));
  const density = CONFIG.DENSITY_MIN + t * (CONFIG.DENSITY_MAX - CONFIG.DENSITY_MIN);
  const fillCount = Math.random() < density ? 2 : 1;
  const lanes = [0, 1, 2];
  let candidates = lanes.slice();
  if (fillCount === 2) {
    candidates = lanes.filter(function(l) { return Math.abs(l - prevEmpty) <= 2; });
  }
  const emptyLane = candidates[Math.floor(Math.random() * candidates.length)];
  const filledLanes = lanes.filter(function(l) { return l !== emptyLane; });
  if (fillCount === 1) {
    const fillLane = filledLanes[Math.floor(Math.random() * filledLanes.length)];
    return { empty: emptyLane, filled: [fillLane] };
  }
  return { empty: emptyLane, filled: filledLanes };
}

const speeds = [18, 25, 35, 45, 52];
const N = 1000;
var totalFail = 0;

speeds.forEach(function(spd) {
  var lane = 1;
  var impossible = 0;
  var totalGap = 0;
  var minGap = Infinity;
  var zigzagCount = 0;
  var prevPrevLane = 1, prevLane = 1;

  for (var i = 0; i < N; i++) {
    var result = chooseEmptyLane(lane, spd);
    var emptyLane = result.empty;
    var laneChange = Math.abs(emptyLane - lane);
    var gap = computeMinGapForChange(spd, laneChange);
    var gapUsed = computeMinGap(spd); // gap yang sebenarnya diberikan (worst-case)

    var relSpeed = spd - CONFIG.OBSTACLE_SPEED;
    var timeAvail = relSpeed > 0 ? gapUsed / relSpeed : 999;
    var timeNeeded = CONFIG.LANE_CHANGE_TIME * laneChange + CONFIG.MIN_REACTION_T_MIN;

    if (timeAvail < timeNeeded - 0.001) {
      impossible++;
    }

    if (i >= 2 && Math.abs(prevPrevLane - lane) === 2 && Math.abs(prevLane - emptyLane) === 2) {
      zigzagCount++;
    }

    totalGap += gapUsed;
    if (gapUsed < minGap) minGap = gapUsed;
    prevPrevLane = prevLane;
    prevLane = lane;
    lane = emptyLane;
  }

  totalFail += impossible;
  var status = impossible === 0 ? "LULUS" : "GAGAL";
  console.log("Kecepatan " + spd + " u/s | Mustahil: " + impossible + "/" + N + " | RataGap: " + (totalGap/N).toFixed(2) + " | MinGap: " + minGap.toFixed(2) + " | Zigzag: " + zigzagCount + " | " + status);
});

console.log("");
console.log("TOTAL MUSTAHIL: " + totalFail + " dari " + (N * speeds.length) + " baris");
if (totalFail === 0) {
  console.log("HASIL: SEMUA LULUS - Tidak ada situasi mustahil dihindari");
} else {
  console.log("HASIL: GAGAL - Ada situasi mustahil");
}
