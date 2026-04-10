import { WORLD_WIDTH, WORLD_HEIGHT } from '../core/Constants.js';

/**
 * Level configurations.
 * Each level defines: name, defense sites, player spawns, and waves.
 * Waves define: enemy types, count, spawn interval, routes, altitude changes.
 */
const LEVELS = [
  // ===== LEVEL 1: COASTAL DEFENSE =====
  {
    name: 'Coastal Defense',
    description: 'Protect the coastal radar station and port from incoming drones.',
    defenseSites: [
      { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.65, name: 'RADAR STATION' },
      { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.7, name: 'PORT' }
    ],
    playerSpawns: [
      { x: WORLD_WIDTH * 0.4, y: WORLD_HEIGHT * 0.85 },
      { x: WORLD_WIDTH * 0.6, y: WORLD_HEIGHT * 0.85 }
    ],
    waves: [
      {
        types: ['DRONE'],
        count: 4,
        interval: 2.0,
        duration: 25,
        cooldownAfter: 3,
        routes: [
          { type: 'straight', start: { x: WORLD_WIDTH * 0.2, y: -50 }, end: { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.65 } },
          { type: 'straight', start: { x: WORLD_WIDTH * 0.8, y: -50 }, end: { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.7 } }
        ]
      },
      {
        types: ['DRONE', 'DRONE', 'FIGHTER'],
        count: 6,
        interval: 1.8,
        duration: 30,
        cooldownAfter: 4,
        routes: [
          { type: 'polygon', waypoints: [
            { x: -50, y: WORLD_HEIGHT * 0.3 },
            { x: WORLD_WIDTH * 0.3, y: WORLD_HEIGHT * 0.25 },
            { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.5 },
            { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.65 }
          ]},
          { type: 'straight', start: { x: WORLD_WIDTH + 50, y: WORLD_HEIGHT * 0.2 }, end: { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.7 } }
        ]
      },
      {
        types: ['FIGHTER', 'DRONE'],
        count: 8,
        interval: 1.5,
        duration: 35,
        cooldownAfter: 3,
        routes: [
          { type: 'bezier', points: [
            { x: WORLD_WIDTH * 0.5, y: -50 },
            { x: WORLD_WIDTH * 0.2, y: WORLD_HEIGHT * 0.2 },
            { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.4 },
            { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.65 }
          ]},
          { type: 'straight', start: { x: -50, y: WORLD_HEIGHT * 0.1 }, end: { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.7 } },
          { type: 'straight', start: { x: WORLD_WIDTH + 50, y: WORLD_HEIGHT * 0.4 }, end: { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.65 } }
        ]
      }
    ]
  },

  // ===== LEVEL 2: MOUNTAIN PASS =====
  {
    name: 'Mountain Pass',
    description: 'Defend the mountain command center from bombers and cruise missiles.',
    defenseSites: [
      { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.55, name: 'COMMAND CENTER' },
      { x: WORLD_WIDTH * 0.25, y: WORLD_HEIGHT * 0.5, name: 'COMM TOWER' },
      { x: WORLD_WIDTH * 0.75, y: WORLD_HEIGHT * 0.5, name: 'SUPPLY DEPOT' }
    ],
    playerSpawns: [
      { x: WORLD_WIDTH * 0.4, y: WORLD_HEIGHT * 0.8 },
      { x: WORLD_WIDTH * 0.6, y: WORLD_HEIGHT * 0.8 }
    ],
    waves: [
      {
        types: ['DRONE'],
        count: 5,
        interval: 1.8,
        duration: 25,
        cooldownAfter: 3,
        altitude: 4000
      },
      {
        types: ['BOMBER', 'DRONE'],
        count: 5,
        interval: 2.5,
        duration: 35,
        cooldownAfter: 4,
        altitude: 6000,
        routes: [
          { type: 'polygon', waypoints: [
            { x: -50, y: WORLD_HEIGHT * 0.2 },
            { x: WORLD_WIDTH * 0.3, y: WORLD_HEIGHT * 0.15 },
            { x: WORLD_WIDTH * 0.6, y: WORLD_HEIGHT * 0.3 },
            { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.55 }
          ]}
        ]
      },
      {
        types: ['CRUISE_MISSILE'],
        count: 3,
        interval: 3.0,
        duration: 25,
        cooldownAfter: 3,
        altitude: 1000,
        altitudeChanges: [{ t: 0.7, alt: 500 }],
        routes: [
          { type: 'bezier', points: [
            { x: WORLD_WIDTH + 50, y: WORLD_HEIGHT * 0.1 },
            { x: WORLD_WIDTH * 0.7, y: WORLD_HEIGHT * 0.05 },
            { x: WORLD_WIDTH * 0.3, y: WORLD_HEIGHT * 0.3 },
            { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.55 }
          ]}
        ]
      },
      {
        types: ['FIGHTER', 'BOMBER', 'DRONE'],
        count: 10,
        interval: 1.5,
        duration: 40,
        cooldownAfter: 3
      },
      {
        types: ['CRUISE_MISSILE', 'FIGHTER'],
        count: 6,
        interval: 2.0,
        duration: 30,
        cooldownAfter: 2,
        altitude: 2000
      }
    ]
  },

  // ===== LEVEL 3: URBAN SIEGE =====
  {
    name: 'Urban Siege',
    description: 'Full-scale assault on the city. Stealth fighters and mixed formations.',
    defenseSites: [
      { x: WORLD_WIDTH * 0.3, y: WORLD_HEIGHT * 0.45, name: 'CITY HALL' },
      { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.6, name: 'HOSPITAL' },
      { x: WORLD_WIDTH * 0.7, y: WORLD_HEIGHT * 0.45, name: 'POWER PLANT' },
      { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.35, name: 'AIRPORT' }
    ],
    playerSpawns: [
      { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.9 },
      { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.9 }
    ],
    waves: [
      {
        types: ['DRONE', 'FIGHTER'],
        count: 6,
        interval: 1.5,
        duration: 25,
        cooldownAfter: 3
      },
      {
        types: ['BOMBER'],
        count: 4,
        interval: 3.0,
        duration: 30,
        cooldownAfter: 3,
        routes: [
          { type: 'polygon', waypoints: [
            { x: -50, y: -50 },
            { x: WORLD_WIDTH * 0.2, y: WORLD_HEIGHT * 0.15 },
            { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.3 },
            { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.6 }
          ]},
          { type: 'polygon', waypoints: [
            { x: WORLD_WIDTH + 50, y: -50 },
            { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.15 },
            { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.3 },
            { x: WORLD_WIDTH * 0.7, y: WORLD_HEIGHT * 0.45 }
          ]}
        ]
      },
      {
        types: ['STEALTH'],
        count: 3,
        interval: 3.5,
        duration: 30,
        cooldownAfter: 4,
        altitude: 7000,
        routes: [
          { type: 'bezier', points: [
            { x: WORLD_WIDTH * 0.5, y: -80 },
            { x: WORLD_WIDTH * 0.1, y: WORLD_HEIGHT * 0.2 },
            { x: WORLD_WIDTH * 0.9, y: WORLD_HEIGHT * 0.3 },
            { x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.6 }
          ]}
        ]
      },
      {
        types: ['CRUISE_MISSILE', 'CRUISE_MISSILE', 'FIGHTER'],
        count: 8,
        interval: 1.2,
        duration: 30,
        cooldownAfter: 3,
        altitude: 1500
      },
      {
        types: ['STEALTH', 'FIGHTER', 'BOMBER'],
        count: 8,
        interval: 1.8,
        duration: 35,
        cooldownAfter: 3
      },
      {
        types: ['CRUISE_MISSILE', 'STEALTH', 'BOMBER', 'FIGHTER', 'DRONE'],
        count: 15,
        interval: 1.0,
        duration: 45,
        cooldownAfter: 2
      }
    ]
  }
];

/**
 * Get level configuration by index.
 * @param {number} index
 * @returns {object}
 */
export function getLevelConfig(index) {
  return LEVELS[Math.min(index, LEVELS.length - 1)];
}

export function getLevelCount() {
  return LEVELS.length;
}
