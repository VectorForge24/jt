/**
 * Bot Engine — 499 simulated students for the leaderboard.
 * Deterministic per-day via seeded PRNG so everyone sees the same board.
 */
import { RANKS, xpToRank } from './xpEngine.js';

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function seededRNG(seed) {
  const rand = mulberry32(seed);
  return {
    float: () => rand(),
    range: (lo,hi) => lo + rand()*(hi-lo),
    pick:  arr => arr[Math.floor(rand()*arr.length)],
    gauss: (mean,sd) => { const u1=Math.max(1e-10,rand()), u2=rand(); return mean+sd*Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2); },
  };
}

const FIRST_NAMES = ['Arjun','Rohan','Aditya','Rahul','Vikram','Karan','Siddharth','Nikhil','Ankit','Aman','Harsh','Prateek','Kunal','Shubham','Akash','Tushar','Deepak','Gaurav','Mohit','Varun','Rishi','Ishan','Pranav','Devesh','Ayush','Abhishek','Sachin','Vivek','Parth','Yash','Dhruv','Kartik','Tanmay','Shreyas','Mihir','Neeraj','Shivam','Lakshay','Rishabh','Mayank','Priya','Anjali','Sneha','Divya','Pooja','Neha','Riya','Kavya','Shreya','Ananya','Ishita','Sanya','Kritika','Aditi','Tanvi','Nidhi','Simran','Poonam','Swati','Meghna','Krati','Harshita','Dipika','Tanya','Navya','Aishwarya','Sonam','Surbhi','Vrinda','Monika','Pallavi','Shivani','Niharika','Aparna','Bhavna','Ruhi','Sakshi','Ridhi','Mansi','Charu'];
const LAST_NAMES = ['Sharma','Singh','Verma','Gupta','Kumar','Mishra','Tiwari','Yadav','Agarwal','Joshi','Pandey','Srivastava','Chauhan','Mehta','Patel','Nair','Pillai','Menon','Reddy','Rao','Iyer','Krishnan','Venkat','Dubey','Chaudhary','Bansal','Goel','Bajaj','Kapoor','Malhotra','Saxena','Tripathi','Shukla','Dwivedi','Upadhyay','Kulkarni','Desai','Jain','Shah','Bose','Chatterjee','Ghosh','Mukherjee','Dutta'];
const SUFFIXES = ['26','27','JEE','IIT','Phy','Math','Chem','Pro','XP','V2','_1'];

const ARCHETYPES = [
  { weight:0.40, name:'Grinder',    mean:850,  sd:180, badDay:0.08 },
  { weight:0.25, name:'Consistent', mean:700,  sd:120, badDay:0.06 },
  { weight:0.15, name:'Rocket',     mean:1100, sd:300, badDay:0.20 },
  { weight:0.10, name:'Slacker',    mean:400,  sd:250, badDay:0.35 },
  { weight:0.10, name:'Elite',      mean:1250, sd:200, badDay:0.05 },
];
function pickArchetype(rng) {
  const r = rng.float(); let c = 0;
  for (const a of ARCHETYPES) { c += a.weight; if (r < c) return a; }
  return ARCHETYPES[0];
}

export function generateBots(baseSeed = 42) {
  const rng = seededRNG(baseSeed);
  const bots = [];
  for (let i = 0; i < 499; i++) {
    const fn = rng.pick(FIRST_NAMES), ln = rng.pick(LAST_NAMES), sf = rng.pick(SUFFIXES);
    bots.push({ id:`bot_${i}`, username:`${fn}${ln.slice(0,3)}${sf}`, archetype: pickArchetype(rng).name, startingXP:0, isBot:true });
  }
  return bots;
}

export function simulateBotDay(bot, dayNumber, baseSeed=42) {
  const seed = baseSeed + parseInt(bot.id.replace('bot_','')) * 1000 + dayNumber;
  const rng = seededRNG(seed);
  const archetype = ARCHETYPES.find(a=>a.name===bot.archetype) || ARCHETYPES[0];
  const isBadDay = rng.float() < archetype.badDay;
  if (isBadDay) return Math.round(rng.range(-600,0));
  let xp = Math.round(rng.gauss(archetype.mean, archetype.sd));
  return Math.max(0, Math.min(xp, 2100));
}

export function getBotTotalXP(bot, dayNumber, baseSeed=42) {
  let total = bot.startingXP;
  for (let d=1; d<=dayNumber; d++) { total += simulateBotDay(bot,d,baseSeed); total = Math.max(0,total); }
  return total;
}

export function buildLeaderboard(bots, dayNumber, realUser, baseSeed=42) {
  const entries = bots.map(bot => {
    const totalXP = getBotTotalXP(bot, dayNumber, baseSeed);
    const { rank, subXP } = xpToRank(totalXP);
    return { id:bot.id, username:bot.username, totalXP, rank, subXP, isBot:true, todayXP: simulateBotDay(bot, dayNumber, baseSeed) };
  });
  const { rank: userRank, subXP: userSubXP } = xpToRank(realUser.totalXP);
  entries.push({ id:realUser.id, username:realUser.username, totalXP:realUser.totalXP, rank:userRank, subXP:userSubXP, isBot:false, todayXP:realUser.todayXP||0, isRealUser:true });
  entries.sort((a,b) => b.totalXP - a.totalXP);
  entries.forEach((e,i) => { e.position = i+1; });
  return entries;
}

export function getPositionDelta(bots, dayNumber, realUser, baseSeed=42) {
  if (dayNumber <= 1) return {};
  const today = buildLeaderboard(bots, dayNumber, realUser, baseSeed);
  const yesterday = buildLeaderboard(bots, dayNumber-1, realUser, baseSeed);
  const prevPos = {}; yesterday.forEach(e => { prevPos[e.id] = e.position; });
  const deltas = {}; today.forEach(e => { const p = prevPos[e.id]; deltas[e.id] = p!==undefined ? p-e.position : 0; });
  return deltas;
}
