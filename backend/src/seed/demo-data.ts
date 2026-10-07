/**
 * Content for the demo database. Times are minutes before "now" so the
 * conversation always looks recent, whenever the seed runs.
 */

export const DEMO_PASSWORD = 'Demo1234';

export interface DemoUser {
  username: string;
  displayName: string;
  bio: string;
  /** Colours for a generated abstract avatar; omitted users keep initials */
  avatar?: [string, string, string];
}

export const DEMO_USERS: DemoUser[] = [
  {
    username: 'demo',
    displayName: 'Demo User',
    bio: 'Exploring this chat. Try replies, reactions and photos!',
  },
  {
    username: 'alex',
    displayName: 'Alex Morgan',
    bio: 'Frontend lead. React, TypeScript, too much coffee ☕',
    avatar: ['#0ea5e9', '#6366f1', '#f0abfc'],
  },
  {
    username: 'maria',
    displayName: 'Maria Kovalenko',
    bio: 'Product designer in Kyiv. Mountains on weekends 🏔',
    avatar: ['#f97316', '#e11d48', '#fde68a'],
  },
  {
    username: 'sam',
    displayName: 'Sam Lee',
    bio: 'Backend & infra. NestJS, Postgres, sleeping on-call.',
    avatar: ['#10b981', '#0f766e', '#a7f3d0'],
  },
  {
    username: 'yuki',
    displayName: 'Yuki Tanaka',
    bio: 'QA engineer. If it can break, I will find out how.',
  },
];

export interface DemoMessage {
  /** Local id used to reference this message in replies */
  key?: string;
  from: string;
  minutesAgo: number;
  text: string;
  replyTo?: string;
  edited?: boolean;
  reactions?: Record<string, string[]>;
  /** Attach the generated landscape photo */
  photo?: boolean;
}

export interface DemoRoom {
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  owner: string;
  members: string[];
  /** Messages newer than this are unread for "demo" (minutes ago; omit = all read) */
  demoReadMinutesAgo?: number;
  messages: DemoMessage[];
}

const DAY = 24 * 60;

export const DEMO_ROOMS: DemoRoom[] = [
  {
    name: 'General',
    type: 'PUBLIC',
    owner: 'alex',
    members: ['alex', 'maria', 'sam', 'yuki', 'demo'],
    demoReadMinutesAgo: 30,
    messages: [
      {
        from: 'alex',
        minutesAgo: 2 * DAY + 40,
        text: 'Welcome to the team chat 👋 Ask anything here.',
      },
      {
        from: 'maria',
        minutesAgo: 2 * DAY + 35,
        text: 'Hi all! Glad to be here.',
        reactions: { '❤️': ['alex', 'sam'] },
      },
      {
        key: 'release',
        from: 'sam',
        minutesAgo: DAY + 120,
        text: 'Heads up: the release is planned for Friday. Please merge your PRs by Thursday evening.',
      },
      {
        from: 'yuki',
        minutesAgo: DAY + 110,
        text: 'I will run the full regression on Thursday night.',
        replyTo: 'release',
        reactions: { '👍': ['sam', 'alex'] },
      },
      {
        from: 'alex',
        minutesAgo: DAY + 100,
        text: 'Frontend is ready, just polishing the light theme.',
        edited: true,
      },
      {
        key: 'lunch',
        from: 'maria',
        minutesAgo: 75,
        text: 'Lunch at 13:00? The new ramen place opened downstairs 🍜',
      },
      { from: 'sam', minutesAgo: 70, text: 'In!', replyTo: 'lunch' },
      {
        from: 'yuki',
        minutesAgo: 25,
        text: 'Count me in too',
        replyTo: 'lunch',
        reactions: { '🔥': ['maria'] },
      },
      {
        from: 'alex',
        minutesAgo: 12,
        text: 'Same. Demo, you should join us 🙂',
      },
    ],
  },
  {
    name: 'Weekend Hike 🏔',
    type: 'PRIVATE',
    owner: 'maria',
    members: ['maria', 'sam', 'demo'],
    demoReadMinutesAgo: 200,
    messages: [
      {
        key: 'plan',
        from: 'maria',
        minutesAgo: 3 * DAY,
        text: 'Saturday: Hoverla via the classic trail. Leaving 6:00 from the station.',
      },
      {
        from: 'sam',
        minutesAgo: 3 * DAY - 20,
        text: 'Weather says sunny until 15:00 ☀️',
        replyTo: 'plan',
      },
      {
        from: 'demo',
        minutesAgo: 2 * DAY,
        text: 'I am in. Need to borrow trekking poles though.',
      },
      {
        from: 'maria',
        minutesAgo: 2 * DAY - 5,
        text: 'I have a spare pair, will bring them.',
        reactions: { '❤️': ['demo'] },
      },
      {
        from: 'maria',
        minutesAgo: 180,
        text: 'View from the top last time. Worth the 5 am alarm.',
        photo: true,
        reactions: { '😮': ['sam'], '🔥': ['sam'] },
      },
      { from: 'sam', minutesAgo: 170, text: 'Okay, now I am convinced 😄' },
    ],
  },
  {
    name: 'Frontend Team',
    type: 'PRIVATE',
    owner: 'alex',
    members: ['alex', 'yuki', 'demo'],
    messages: [
      {
        key: 'pr',
        from: 'alex',
        minutesAgo: 5 * 60,
        text: 'PR for the reactions UI is up, reviews welcome.',
      },
      {
        from: 'yuki',
        minutesAgo: 4 * 60,
        text: 'Found one edge case: double click on a chip adds and removes instantly. Otherwise 👍',
        replyTo: 'pr',
      },
      {
        from: 'alex',
        minutesAgo: 4 * 60 - 10,
        text: 'Good catch, the server handles the race now. Merged.',
        reactions: { '👍': ['yuki', 'demo'] },
      },
    ],
  },
  {
    name: 'Design Review',
    type: 'PUBLIC',
    owner: 'maria',
    members: ['maria', 'alex'],
    messages: [
      {
        from: 'maria',
        minutesAgo: 2 * DAY + 300,
        text: 'New room list mockups: last message preview, unread badges, sorted by activity.',
      },
      {
        from: 'alex',
        minutesAgo: 2 * DAY + 280,
        text: 'Love it. Implementing this week.',
        reactions: { '👍': ['maria'] },
      },
    ],
  },
];
