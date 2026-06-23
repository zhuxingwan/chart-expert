// Curated Mermaid templates — one per diagram type, with Chinese sample content.
// Each template's `defaultCode` is complete, valid Mermaid syntax.

export interface MermaidTemplateMeta {
  id: string
  name: string
  description: string // when to use it (Chinese)
  category: string
  type: string // mermaid diagram type
  icon: string // lucide icon name key
  defaultCode: string
}

export const MERMAID_TEMPLATES: MermaidTemplateMeta[] = [
  {
    id: 'flowchart',
    name: '流程图',
    description: '适合展示业务流程、决策分支、状态切换',
    category: '流程',
    type: 'flowchart',
    icon: 'Workflow',
    defaultCode: `flowchart TD
    A([开始]) --> B{是否登录?}
    B -->|是| C[进入主页]
    B -->|否| D[跳转登录]
    D --> E[输入账号密码]
    E --> F{验证成功?}
    F -->|是| C
    F -->|否| D
    C --> G([结束])`,
  },
  {
    id: 'sequence',
    name: '时序图',
    description: '适合展示多个角色之间的交互顺序',
    category: '流程',
    type: 'sequence',
    icon: 'ArrowRightLeft',
    defaultCode: `sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant D as 数据库
    U->>F: 点击登录
    F->>B: POST /login
    B->>D: 查询用户
    D-->>B: 返回用户信息
    B-->>F: 返回 Token
    F-->>U: 跳转主页`,
  },
  {
    id: 'class',
    name: '类图',
    description: '适合展示系统结构、类与类之间的关系',
    category: '结构',
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
    name: '状态图',
    description: '适合展示对象状态流转、订单生命周期',
    category: '流程',
    type: 'state',
    icon: 'State',
    defaultCode: `stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已支付: 用户付款
    待支付 --> 已取消: 超时取消
    已支付 --> 已发货: 商家发货
    已发货 --> 已签收: 用户签收
    已签收 --> 已完成: 确认收货
    已取消 --> [*]
    已完成 --> [*]`,
  },
  {
    id: 'er',
    name: 'ER 图',
    description: '适合展示数据库表结构与表关系',
    category: '结构',
    type: 'er',
    icon: 'Database',
    defaultCode: `erDiagram
    USER ||--o{ ORDER : "下单"
    ORDER ||--|{ ORDER_ITEM : "包含"
    PRODUCT ||--o{ ORDER_ITEM : "被购买"
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
    name: '甘特图',
    description: '适合展示项目排期、任务时间线',
    category: '时间',
    type: 'gantt',
    icon: 'CalendarClock',
    defaultCode: `gantt
    title 产品上线计划
    dateFormat YYYY-MM-DD
    axisFormat %m-%d
    section 设计阶段
      需求调研 :done, a1, 2024-01-01, 7d
      原型设计 :done, a2, after a1, 5d
      视觉设计 :active, a3, after a2, 7d
    section 开发阶段
      前端开发 :b1, after a3, 14d
      后端开发 :b2, after a3, 14d
      联调测试 :b3, after b1, 7d
    section 上线阶段
      灰度发布 :c1, after b3, 3d
      全量上线 :c2, after c1, 2d`,
  },
  {
    id: 'journey',
    name: '用户旅程图',
    description: '适合展示用户体验路径与情绪曲线',
    category: '体验',
    type: 'journey',
    icon: 'Footprints',
    defaultCode: `journey
    title 用户购物旅程
    section 发现
      浏览首页: 5: 用户
      搜索商品: 4: 用户
    section 决策
      查看详情: 4: 用户
      对比价格: 3: 用户
      查看评价: 5: 用户
    section 购买
      加入购物车: 5: 用户
      提交订单: 4: 用户
      完成支付: 5: 用户
    section 售后
      等待发货: 3: 用户
      收货确认: 5: 用户`,
  },
  {
    id: 'mindmap',
    name: '思维导图',
    description: '适合展示发散性思考、知识结构',
    category: '结构',
    type: 'mindmap',
    icon: 'Brain',
    defaultCode: `mindmap
  root((产品策略))
    目标用户
      年轻群体
        学生
        职场新人
      中年家庭
    核心功能
      社交互动
      内容创作
      电商转化
    商业模式
      广告变现
      会员订阅
      交易佣金
    增长策略
      内容营销
      KOL 合作
      社群运营`,
  },
  {
    id: 'pie',
    name: '饼图',
    description: '适合展示占比分布',
    category: '数据',
    type: 'pie',
    icon: 'PieChart',
    defaultCode: `pie showData
    title 2024 年市场份额
    "苹果" : 35
    "三星" : 22
    "小米" : 18
    "华为" : 15
    "其他" : 10`,
  },
  {
    id: 'gitgraph',
    name: 'Git 流程图',
    description: '适合展示分支管理与发布流程',
    category: '流程',
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
    name: '时间线',
    description: '适合展示历史事件、产品里程碑',
    category: '时间',
    type: 'timeline',
    icon: 'Timeline',
    defaultCode: `timeline
    title 公司发展历程
    section 2020
      3月 : 公司成立
      8月 : 首个产品上线
    section 2021
      1月 : 获得天使轮融资
      7月 : 用户突破百万
    section 2022
      4月 : B 轮融资完成
      11月 : 海外市场开拓
    section 2023
      6月 : 成功上市`,
  },
]

export const MERMAID_THEMES = [
  { id: 'default', name: '默认' },
  { id: 'dark', name: '暗色' },
  { id: 'forest', name: '森林' },
  { id: 'neutral', name: '中性' },
  { id: 'base', name: '基础' },
]

export const SYNTAX_CHEATSHEET: { type: string; title: string; lines: string[] }[] = [
  {
    type: 'flowchart',
    title: '流程图语法',
    lines: [
      'flowchart TD  // TD=上下, LR=左右',
      'A[矩形]  // 普通节点',
      'A([圆角])  // 圆角节点',
      'A{决策}  // 菱形决策',
      'A --> B  // 箭头连接',
      'A -->|标签| B  // 带标签箭头',
    ],
  },
  {
    type: 'sequence',
    title: '时序图语法',
    lines: [
      'sequenceDiagram',
      'participant A as 角色 A',
      'A->>B: 实线箭头',
      'B-->>A: 虚线箭头',
      'A-xB: 异步消息',
      'Note over A,B: 跨角色注释',
    ],
  },
  {
    type: 'class',
    title: '类图语法',
    lines: [
      'classDiagram',
      'class Name {',
      '  +String field  // + public',
      '  -int private  // - private',
      '  #method() void  // # protected',
      '}',
      'A <|-- B  // 继承',
      'A *-- B  // 组合',
    ],
  },
  {
    type: 'state',
    title: '状态图语法',
    lines: [
      'stateDiagram-v2',
      '[*] --> 状态A  // 起点',
      '状态A --> 状态B: 事件',
      '状态B --> [*]  // 终点',
      'state 状态C {  // 嵌套状态',
      '  [*] --> 子状态',
      '}',
    ],
  },
  {
    type: 'gantt',
    title: '甘特图语法',
    lines: [
      'gantt',
      'dateFormat YYYY-MM-DD',
      'section 阶段名',
      '任务名 :状态, id, 开始, 持续',
      '  // 状态: done/active/todo/crit',
      '  // 开始: 日期 或 after id',
      '  // 持续: 7d / 1w / 1month',
    ],
  },
  {
    type: 'pie',
    title: '饼图语法',
    lines: [
      'pie showData',
      'title 标题',
      '"类别 A" : 35',
      '"类别 B" : 25',
      '"类别 C" : 40',
    ],
  },
  {
    type: 'mindmap',
    title: '思维导图语法',
    lines: [
      'mindmap',
      '  root((根节点))',
      '    一级分支',
      '      二级分支',
      '        三级分支',
      '    另一个分支',
      '  // 缩进决定层级',
    ],
  },
  {
    type: 'timeline',
    title: '时间线语法',
    lines: [
      'timeline',
      'title 标题',
      'section 2020',
      '  3月 : 事件 A',
      '  8月 : 事件 B',
      'section 2021',
      '  1月 : 事件 C',
    ],
  },
]
