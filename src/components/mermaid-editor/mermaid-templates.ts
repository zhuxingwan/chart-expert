// Curated Mermaid templates — one per diagram type, with English sample content.
// Each template's `defaultCode` is complete, valid Mermaid syntax.

export interface MermaidTemplateMeta {
  id: string
  name: string
  description: string // when to use it
  category: string
  type: string // mermaid diagram type
  icon: string // lucide icon name key
  defaultCode: string
}

export const MERMAID_TEMPLATES: MermaidTemplateMeta[] = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    description: 'Business processes, decision branches, state transitions',
    category: 'Flow',
    type: 'flowchart',
    icon: 'Workflow',
    defaultCode: `flowchart TD
    A([Start]) --> B{Logged in?}
    B -->|Yes| C[Enter Home]
    B -->|No| D[Go to Login]
    D --> E[Enter username & password]
    E --> F{Auth success?}
    F -->|Yes| C
    F -->|No| D
    C --> G([End])`,
  },
  {
    id: 'sequence',
    name: 'Sequence Diagram',
    description: 'Interaction order between multiple actors',
    category: 'Flow',
    type: 'sequence',
    icon: 'ArrowRightLeft',
    defaultCode: `sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    U->>F: Click login
    F->>B: POST /login
    B->>D: Query user
    D-->>B: Return user info
    B-->>F: Return Token
    F-->>U: Redirect to home`,
  },
  {
    id: 'class',
    name: 'Class Diagram',
    description: 'System structure and class relationships',
    category: 'Structure',
    type: 'class',
    icon: 'Network',
    defaultCode: `classDiagram
    class Animal {
      +String name
      +int age
      +eat() void
      +sleep() void
    }
    class Dog {
      +bark() void
    }
    class Cat {
      +meow() void
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    id: 'state',
    name: 'State Diagram',
    description: 'Object state transitions, order lifecycle',
    category: 'Flow',
    type: 'state',
    icon: 'State',
    defaultCode: `stateDiagram-v2
    [*] --> Pending Payment
    Pending Payment --> Paid: User pays
    Pending Payment --> Cancelled: Timeout
    Paid --> Shipped: Merchant ships
    Shipped --> Received: User receives
    Received --> Completed: Confirm receipt
    Cancelled --> [*]
    Completed --> [*]`,
  },
  {
    id: 'er',
    name: 'ER Diagram',
    description: 'Database table structure and relationships',
    category: 'Structure',
    type: 'er',
    icon: 'Database',
    defaultCode: `erDiagram
    USER ||--o{ ORDER : "places"
    ORDER ||--|{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "purchased as"
    USER {
      int id PK
      string name
      string email
    }
    ORDER {
      int id PK
      int user_id FK
      datetime created_at
    }
    ORDER_ITEM {
      int id PK
      int order_id FK
      int product_id FK
      int quantity
    }
    PRODUCT {
      int id PK
      string name
      decimal price
    }`,
  },
  {
    id: 'gantt',
    name: 'Gantt Chart',
    description: 'Project schedules and task timelines',
    category: 'Time',
    type: 'gantt',
    icon: 'CalendarClock',
    defaultCode: `gantt
    title Product Launch Plan
    dateFormat YYYY-MM-DD
    axisFormat %m-%d
    section Design Phase
      Requirements research :done, a1, 2024-01-01, 7d
      Prototype design :done, a2, after a1, 5d
      Visual design :active, a3, after a2, 7d
    section Development Phase
      Frontend dev :b1, after a3, 14d
      Backend dev :b2, after a3, 14d
      Integration test :b3, after b1, 7d
    section Launch Phase
      Canary release :c1, after b3, 3d
      Full rollout :c2, after c1, 2d`,
  },
  {
    id: 'journey',
    name: 'User Journey',
    description: 'User experience path and emotion curve',
    category: 'Experience',
    type: 'journey',
    icon: 'Footprints',
    defaultCode: `journey
    title User Shopping Journey
    section Discovery
      Browse home: 5: User
      Search products: 4: User
    section Decision
      View details: 4: User
      Compare prices: 3: User
      Read reviews: 5: User
    section Purchase
      Add to cart: 5: User
      Submit order: 4: User
      Complete payment: 5: User
    section After-sales
      Wait for shipment: 3: User
      Confirm receipt: 5: User`,
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Divergent thinking and knowledge structure',
    category: 'Structure',
    type: 'mindmap',
    icon: 'Brain',
    defaultCode: `mindmap
  root((Product Strategy))
    Target Users
      Young
        Students
        New professionals
      Middle-aged families
    Core Features
      Social interaction
      Content creation
      E-commerce conversion
    Business Model
      Ad monetization
      Membership subscription
      Transaction commission
    Growth Strategy
      Content marketing
      KOL partnerships
      Community operations`,
  },
  {
    id: 'pie',
    name: 'Pie Chart',
    description: 'Share distribution',
    category: 'Data',
    type: 'pie',
    icon: 'PieChart',
    defaultCode: `pie showData
    title 2024 Market Share
    "Apple" : 35
    "Samsung" : 22
    "Xiaomi" : 18
    "Huawei" : 15
    "Others" : 10`,
  },
  {
    id: 'gitgraph',
    name: 'Git Graph',
    description: 'Branch management and release flow',
    category: 'Flow',
    type: 'gitgraph',
    icon: 'GitBranch',
    defaultCode: `gitGraph
    commit id: "init"
    branch develop
    checkout develop
    commit id: "feat-1"
    commit id: "feat-2"
    branch feature/login
    checkout feature/login
    commit id: "login-ui"
    commit id: "login-api"
    checkout develop
    merge feature/login
    branch release/v1.0
    checkout release/v1.0
    commit id: "fix-bug"
    checkout main
    merge release/v1.0 tag: "v1.0.0"`,
  },
  {
    id: 'timeline',
    name: 'Timeline',
    description: 'Historical events, product milestones',
    category: 'Time',
    type: 'timeline',
    icon: 'Timeline',
    defaultCode: `timeline
    title Company Milestones
    section 2020
      March : Company founded
      August : First product launched
    section 2021
      January : Angel round closed
      July : 1M users reached
    section 2022
      April : Series B completed
      November : Overseas expansion
    section 2023
      June : IPO completed`,
  },
]

export const MERMAID_THEMES = [
  { id: 'default', name: 'Default' },
  { id: 'dark', name: 'Dark' },
  { id: 'forest', name: 'Forest' },
  { id: 'neutral', name: 'Neutral' },
  { id: 'base', name: 'Base' },
]

export const SYNTAX_CHEATSHEET: { type: string; title: string; lines: string[] }[] = [
  {
    type: 'flowchart',
    title: 'Flowchart Syntax',
    lines: [
      'flowchart TD  // TD=top-bottom, LR=left-right',
      'A[Rectangle]  // regular node',
      'A([Rounded])  // rounded node',
      'A{Decision}  // diamond decision',
      'A --> B  // arrow connection',
      'A -->|Label| B  // labeled arrow',
    ],
  },
  {
    type: 'sequence',
    title: 'Sequence Syntax',
    lines: [
      'sequenceDiagram',
      'participant A as Actor A',
      'A->>B: Solid arrow',
      'B-->>A: Dashed arrow',
      'A-xB: Async message',
      'Note over A,B: Cross-actor note',
    ],
  },
  {
    type: 'class',
    title: 'Class Syntax',
    lines: [
      'classDiagram',
      'class Name {',
      '  +String field  // + public',
      '  -int private  // - private',
      '  #method() void  // # protected',
      '}',
      'A <|-- B  // inheritance',
      'A *-- B  // composition',
    ],
  },
  {
    type: 'state',
    title: 'State Syntax',
    lines: [
      'stateDiagram-v2',
      '[*] --> StateA  // start',
      'StateA --> StateB: Event',
      'StateB --> [*]  // end',
      'state StateC {  // nested state',
      '  [*] --> SubState',
      '}',
    ],
  },
  {
    type: 'gantt',
    title: 'Gantt Syntax',
    lines: [
      'gantt',
      'dateFormat YYYY-MM-DD',
      'section Phase name',
      'Task name :status, id, start, duration',
      '  // status: done/active/todo/crit',
      '  // start: date or after id',
      '  // duration: 7d / 1w / 1month',
    ],
  },
  {
    type: 'pie',
    title: 'Pie Syntax',
    lines: [
      'pie showData',
      'title Title',
      '"Category A" : 35',
      '"Category B" : 25',
      '"Category C" : 40',
    ],
  },
  {
    type: 'mindmap',
    title: 'Mindmap Syntax',
    lines: [
      'mindmap',
      '  root((Root node))',
      '    First level',
      '      Second level',
      '        Third level',
      '    Another branch',
      '  // Indentation decides hierarchy',
    ],
  },
  {
    type: 'timeline',
    title: 'Timeline Syntax',
    lines: [
      'timeline',
      'title Title',
      'section 2020',
      '  March : Event A',
      '  August : Event B',
      'section 2021',
      '  January : Event C',
    ],
  },
]
