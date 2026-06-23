// Curated subset of @antv/infographic's 276 built-in templates, organized by
// category with human-readable names & descriptions. The full registry is
// accessible at runtime via `getTemplates()`, but we surface a curated set
// here so non-technical users see a friendly, finite gallery.

import type { InfographicTemplateCategory } from '@/types/chart'

export interface TemplateMeta {
  id: string
  name: string
  description: string
  category: InfographicTemplateCategory
  /** Which data shape this template expects */
  dataShape: 'list' | 'hierarchy' | 'relation' | 'compare'
  tags: string[]
}

export const CATEGORY_LABEL: Record<InfographicTemplateCategory, string> = {
  list: '列表',
  sequence: '流程 / 步骤',
  compare: '对比',
  hierarchy: '层级 / 树形',
  relation: '关系网络',
  chart: '图表',
  quadrant: '象限',
}

export const CATEGORY_ORDER: InfographicTemplateCategory[] = [
  'list',
  'sequence',
  'compare',
  'hierarchy',
  'relation',
  'chart',
  'quadrant',
]

export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  // ---------- list ----------
  { id: 'list-row-simple-horizontal-arrow', name: '横向箭头步骤', description: '横向排列的步骤，箭头连接', category: 'list', dataShape: 'list', tags: ['步骤', '横向', '箭头'] },
  { id: 'list-row-horizontal-icon-line', name: '横向图标线', description: '横向带图标的列表，线性连接', category: 'list', dataShape: 'list', tags: ['图标', '横向'] },
  { id: 'list-row-circular-progress', name: '环形进度', description: '横向排列的环形进度项', category: 'list', dataShape: 'list', tags: ['进度', '环形'] },
  { id: 'list-row-simple-illus', name: '横向插画列表', description: '横向排列的插画式列表', category: 'list', dataShape: 'list', tags: ['插画', '横向'] },
  { id: 'list-grid-simple', name: '网格简约', description: '网格布局的简约卡片', category: 'list', dataShape: 'list', tags: ['网格', '简约'] },
  { id: 'list-grid-compact-card', name: '网格紧凑卡', description: '网格布局的紧凑卡片', category: 'list', dataShape: 'list', tags: ['网格', '卡片'] },
  { id: 'list-grid-badge-card', name: '网格徽标卡', description: '带徽标的网格卡片', category: 'list', dataShape: 'list', tags: ['网格', '徽标'] },
  { id: 'list-grid-progress-card', name: '网格进度卡', description: '带进度条的网格卡片', category: 'list', dataShape: 'list', tags: ['网格', '进度'] },
  { id: 'list-grid-circular-progress', name: '网格环形进度', description: '网格布局的环形进度', category: 'list', dataShape: 'list', tags: ['网格', '环形'] },
  { id: 'list-grid-ribbon-card', name: '网格丝带卡', description: '带丝带装饰的网格卡片', category: 'list', dataShape: 'list', tags: ['网格', '丝带'] },
  { id: 'list-grid-candy-card-lite', name: '糖果卡', description: '糖果风格的网格卡片', category: 'list', dataShape: 'list', tags: ['糖果', '可爱'] },
  { id: 'list-grid-done-list', name: '网格清单', description: '清单风格的网格列表', category: 'list', dataShape: 'list', tags: ['清单', 'todo'] },
  { id: 'list-grid-horizontal-icon-arrow', name: '网格横箭头', description: '网格布局的横向箭头连接', category: 'list', dataShape: 'list', tags: ['网格', '箭头'] },
  { id: 'list-column-done-list', name: '纵向清单', description: '纵向排列的清单', category: 'list', dataShape: 'list', tags: ['纵向', '清单'] },
  { id: 'list-column-simple-vertical-arrow', name: '纵向箭头', description: '纵向排列的箭头连接', category: 'list', dataShape: 'list', tags: ['纵向', '箭头'] },
  { id: 'list-column-vertical-icon-arrow', name: '纵向图标箭头', description: '纵向带图标的箭头列表', category: 'list', dataShape: 'list', tags: ['纵向', '图标'] },
  { id: 'list-pyramid-badge-card', name: '金字塔徽标卡', description: '金字塔布局的徽标卡片', category: 'list', dataShape: 'list', tags: ['金字塔', '徽标'] },
  { id: 'list-pyramid-compact-card', name: '金字塔紧凑卡', description: '金字塔布局的紧凑卡片', category: 'list', dataShape: 'list', tags: ['金字塔'] },
  { id: 'list-pyramid-rounded-rect-node', name: '金字塔圆角', description: '金字塔布局的圆角节点', category: 'list', dataShape: 'list', tags: ['金字塔', '圆角'] },
  { id: 'list-sector-simple', name: '扇形简约', description: '扇形布局的简约项', category: 'list', dataShape: 'list', tags: ['扇形'] },
  { id: 'list-sector-plain-text', name: '扇形文本', description: '扇形布局的纯文本', category: 'list', dataShape: 'list', tags: ['扇形', '文本'] },
  { id: 'list-sector-half-plain-text', name: '半扇形', description: '半圆扇形布局', category: 'list', dataShape: 'list', tags: ['扇形', '半圆'] },
  { id: 'list-waterfall-compact-card', name: '瀑布紧凑卡', description: '瀑布流布局的紧凑卡片', category: 'list', dataShape: 'list', tags: ['瀑布'] },
  { id: 'list-waterfall-badge-card', name: '瀑布徽标卡', description: '瀑布流布局的徽标卡片', category: 'list', dataShape: 'list', tags: ['瀑布', '徽标'] },
  { id: 'list-zigzag-up-compact-card', name: '上行之字卡', description: '之字形向上的紧凑卡片', category: 'list', dataShape: 'list', tags: ['之字', '上行'] },
  { id: 'list-zigzag-up-simple', name: '上行之字简约', description: '之字形向上的简约', category: 'list', dataShape: 'list', tags: ['之字'] },
  { id: 'list-zigzag-down-compact-card', name: '下行之字卡', description: '之字形向下的紧凑卡片', category: 'list', dataShape: 'list', tags: ['之字', '下行'] },
  { id: 'list-zigzag-down-simple', name: '下行之字简约', description: '之字形向下的简约', category: 'list', dataShape: 'list', tags: ['之字'] },

  // ---------- sequence ----------
  { id: 'sequence-timeline-simple', name: '时间线简约', description: '横向时间线，简约风格', category: 'sequence', dataShape: 'list', tags: ['时间线', '横向'] },
  { id: 'sequence-timeline-plain-text', name: '时间线文本', description: '横向时间线，纯文本', category: 'sequence', dataShape: 'list', tags: ['时间线', '文本'] },
  { id: 'sequence-timeline-done-list', name: '时间线清单', description: '时间线清单风格', category: 'sequence', dataShape: 'list', tags: ['时间线', '清单'] },
  { id: 'sequence-timeline-rounded-rect-node', name: '时间线圆角', description: '时间线圆角节点', category: 'sequence', dataShape: 'list', tags: ['时间线', '圆角'] },
  { id: 'sequence-timeline-simple-illus', name: '时间线插画', description: '时间线插画风格', category: 'sequence', dataShape: 'list', tags: ['时间线', '插画'] },
  { id: 'sequence-steps-simple', name: '步骤简约', description: '简单步骤排列', category: 'sequence', dataShape: 'list', tags: ['步骤'] },
  { id: 'sequence-steps-badge-card', name: '步骤徽标卡', description: '带徽标的步骤卡片', category: 'sequence', dataShape: 'list', tags: ['步骤', '徽标'] },
  { id: 'sequence-steps-simple-illus', name: '步骤插画', description: '插画风格的步骤', category: 'sequence', dataShape: 'list', tags: ['步骤', '插画'] },
  { id: 'sequence-snake-steps-compact-card', name: '蛇形紧凑卡', description: '蛇形排布的紧凑卡片', category: 'sequence', dataShape: 'list', tags: ['蛇形'] },
  { id: 'sequence-snake-steps-pill-badge', name: '蛇形胶囊', description: '蛇形排布的胶囊徽标', category: 'sequence', dataShape: 'list', tags: ['蛇形', '胶囊'] },
  { id: 'sequence-snake-steps-simple', name: '蛇形简约', description: '蛇形排布的简约', category: 'sequence', dataShape: 'list', tags: ['蛇形'] },
  { id: 'sequence-snake-steps-simple-illus', name: '蛇形插画', description: '蛇形排布的插画', category: 'sequence', dataShape: 'list', tags: ['蛇形', '插画'] },
  { id: 'sequence-color-snake-steps-horizontal-icon-line', name: '彩色蛇形线', description: '彩色蛇形带图标连接线', category: 'sequence', dataShape: 'list', tags: ['蛇形', '彩色'] },
  { id: 'sequence-color-snake-steps-simple-illus', name: '彩色蛇形插画', description: '彩色蛇形插画风格', category: 'sequence', dataShape: 'list', tags: ['蛇形', '插画', '彩色'] },
  { id: 'sequence-roadmap-vertical-plain-text', name: '纵向路线图', description: '纵向路线图，纯文本', category: 'sequence', dataShape: 'list', tags: ['路线图', '纵向'] },
  { id: 'sequence-roadmap-vertical-simple', name: '纵向路线简约', description: '纵向路线图，简约', category: 'sequence', dataShape: 'list', tags: ['路线图', '纵向'] },
  { id: 'sequence-roadmap-vertical-badge-card', name: '纵向路线徽标', description: '纵向路线图，徽标卡片', category: 'sequence', dataShape: 'list', tags: ['路线图', '徽标'] },
  { id: 'sequence-roadmap-vertical-pill-badge', name: '纵向路线胶囊', description: '纵向路线图，胶囊徽标', category: 'sequence', dataShape: 'list', tags: ['路线图', '胶囊'] },
  { id: 'sequence-roadmap-vertical-quarter-circular', name: '纵向路线四圆', description: '纵向路线图，四分之一圆', category: 'sequence', dataShape: 'list', tags: ['路线图', '圆弧'] },
  { id: 'sequence-roadmap-vertical-quarter-simple-card', name: '纵向路线四卡', description: '纵向路线图，四分之一简约卡', category: 'sequence', dataShape: 'list', tags: ['路线图'] },
  { id: 'sequence-roadmap-vertical-underline-text', name: '纵向路线下划线', description: '纵向路线图，下划线文本', category: 'sequence', dataShape: 'list', tags: ['路线图', '下划线'] },
  { id: 'sequence-horizontal-zigzag-simple', name: '横之字简约', description: '横向之字形简约', category: 'sequence', dataShape: 'list', tags: ['之字', '横向'] },
  { id: 'sequence-horizontal-zigzag-plain-text', name: '横之字文本', description: '横向之字形纯文本', category: 'sequence', dataShape: 'list', tags: ['之字', '横向'] },
  { id: 'sequence-horizontal-zigzag-simple-illus', name: '横之字插画', description: '横向之字形插画', category: 'sequence', dataShape: 'list', tags: ['之字', '插画'] },
  { id: 'sequence-horizontal-zigzag-simple-horizontal-arrow', name: '横之字箭头', description: '横向之字形带箭头', category: 'sequence', dataShape: 'list', tags: ['之字', '箭头'] },
  { id: 'sequence-horizontal-zigzag-horizontal-icon-line', name: '横之字图标', description: '横向之字形带图标线', category: 'sequence', dataShape: 'list', tags: ['之字', '图标'] },
  { id: 'sequence-horizontal-zigzag-underline-text', name: '横之字下划线', description: '横向之字形下划线', category: 'sequence', dataShape: 'list', tags: ['之字', '下划线'] },
  { id: 'sequence-zigzag-steps-underline-text', name: '之字步骤下划线', description: '之字形步骤下划线', category: 'sequence', dataShape: 'list', tags: ['之字', '下划线'] },
  { id: 'sequence-circle-arrows-indexed-card', name: '环形箭头卡', description: '环形箭头带编号卡', category: 'sequence', dataShape: 'list', tags: ['环形', '箭头'] },
  { id: 'sequence-zigzag-pucks-3d-simple', name: '3D 之字盘', description: '3D 之字形圆盘简约', category: 'sequence', dataShape: 'list', tags: ['3D', '之字'] },
  { id: 'sequence-zigzag-pucks-3d-underline-text', name: '3D 之字下划线', description: '3D 之字形圆盘下划线', category: 'sequence', dataShape: 'list', tags: ['3D', '下划线'] },
  { id: 'sequence-zigzag-pucks-3d-indexed-card', name: '3D 之字编号', description: '3D 之字形圆盘编号卡', category: 'sequence', dataShape: 'list', tags: ['3D', '编号'] },
  { id: 'sequence-ascending-stairs-3d-simple', name: '3D 阶梯', description: '3D 上升阶梯简约', category: 'sequence', dataShape: 'list', tags: ['3D', '阶梯'] },
  { id: 'sequence-ascending-stairs-3d-underline-text', name: '3D 阶梯下划线', description: '3D 上升阶梯下划线', category: 'sequence', dataShape: 'list', tags: ['3D', '下划线'] },
  { id: 'sequence-ascending-steps', name: '上升阶梯', description: 'L 形上升阶梯', category: 'sequence', dataShape: 'list', tags: ['阶梯', '上升'] },
  { id: 'sequence-cylinders-3d-simple', name: '3D 圆柱', description: '3D 圆柱简约', category: 'sequence', dataShape: 'list', tags: ['3D', '圆柱'] },
  { id: 'sequence-circular-simple', name: '环形简约', description: '环形排布简约', category: 'sequence', dataShape: 'list', tags: ['环形'] },
  { id: 'sequence-circular-underline-text', name: '环形下划线', description: '环形排布下划线', category: 'sequence', dataShape: 'list', tags: ['环形', '下划线'] },
  { id: 'sequence-filter-mesh-simple', name: '滤网简约', description: '滤网形排布简约', category: 'sequence', dataShape: 'list', tags: ['滤网'] },
  { id: 'sequence-filter-mesh-underline-text', name: '滤网下划线', description: '滤网形排布下划线', category: 'sequence', dataShape: 'list', tags: ['滤网', '下划线'] },
  { id: 'sequence-mountain-underline-text', name: '山下划线', description: '山形排布下划线', category: 'sequence', dataShape: 'list', tags: ['山形'] },
  { id: 'sequence-pyramid-simple', name: '金字塔', description: '金字塔步骤', category: 'sequence', dataShape: 'list', tags: ['金字塔'] },
  { id: 'sequence-funnel-simple', name: '漏斗', description: '漏斗步骤', category: 'sequence', dataShape: 'list', tags: ['漏斗'] },
  { id: 'sequence-stairs-front-simple', name: '前阶梯', description: '正面阶梯简约', category: 'sequence', dataShape: 'list', tags: ['阶梯'] },
  { id: 'sequence-stairs-front-compact-card', name: '前阶梯紧凑', description: '正面阶梯紧凑卡', category: 'sequence', dataShape: 'list', tags: ['阶梯'] },
  { id: 'sequence-stairs-front-pill-badge', name: '前阶梯胶囊', description: '正面阶梯胶囊徽标', category: 'sequence', dataShape: 'list', tags: ['阶梯', '胶囊'] },
  { id: 'sequence-interaction-default-badge-card', name: '交互徽标卡', description: '交互时序徽标卡', category: 'sequence', dataShape: 'list', tags: ['交互', '时序'] },
  { id: 'sequence-interaction-default-compact-card', name: '交互紧凑卡', description: '交互时序紧凑卡', category: 'sequence', dataShape: 'list', tags: ['交互', '时序'] },
  { id: 'sequence-interaction-default-capsule-item', name: '交互胶囊', description: '交互时序胶囊项', category: 'sequence', dataShape: 'list', tags: ['交互', '胶囊'] },
  { id: 'sequence-interaction-default-rounded-rect-node', name: '交互圆角', description: '交互时序圆角节点', category: 'sequence', dataShape: 'list', tags: ['交互', '圆角'] },
  { id: 'sequence-interaction-compact-capsule-item', name: '紧凑交互胶囊', description: '紧凑式交互胶囊', category: 'sequence', dataShape: 'list', tags: ['交互', '紧凑'] },
  { id: 'sequence-interaction-wide-capsule-item', name: '宽交互胶囊', description: '宽式交互胶囊', category: 'sequence', dataShape: 'list', tags: ['交互', '宽'] },
  { id: 'sequence-interaction-default-dashed-capsule-item', name: '虚线交互胶囊', description: '虚线交互胶囊', category: 'sequence', dataShape: 'list', tags: ['交互', '虚线'] },
  { id: 'sequence-interaction-default-animated-capsule-item', name: '动效交互胶囊', description: '动效交互胶囊', category: 'sequence', dataShape: 'list', tags: ['交互', '动效'] },

  // ---------- compare ----------
  { id: 'compare-binary-horizontal-simple-vs', name: '对比 VS 简约', description: '左右 VS 对比', category: 'compare', dataShape: 'compare', tags: ['对比', 'VS'] },
  { id: 'compare-binary-horizontal-compact-card-vs', name: '对比 VS 紧凑', description: 'VS 对比紧凑卡', category: 'compare', dataShape: 'compare', tags: ['对比', 'VS', '紧凑'] },
  { id: 'compare-binary-horizontal-badge-card-vs', name: '对比 VS 徽标', description: 'VS 对比徽标卡', category: 'compare', dataShape: 'compare', tags: ['对比', 'VS', '徽标'] },
  { id: 'compare-binary-horizontal-underline-text-vs', name: '对比 VS 下划线', description: 'VS 对比下划线', category: 'compare', dataShape: 'compare', tags: ['对比', 'VS', '下划线'] },
  { id: 'compare-binary-horizontal-simple-arrow', name: '对比箭头简约', description: '箭头对比简约', category: 'compare', dataShape: 'compare', tags: ['对比', '箭头'] },
  { id: 'compare-binary-horizontal-compact-card-arrow', name: '对比箭头紧凑', description: '箭头对比紧凑卡', category: 'compare', dataShape: 'compare', tags: ['对比', '箭头', '紧凑'] },
  { id: 'compare-binary-horizontal-simple-fold', name: '对比折叠', description: '折叠式对比', category: 'compare', dataShape: 'compare', tags: ['对比', '折叠'] },
  { id: 'compare-hierarchy-row-letter-card-compact-card', name: '行式字母卡', description: '行式层级字母卡对比', category: 'compare', dataShape: 'compare', tags: ['对比', '层级'] },
  { id: 'compare-hierarchy-row-letter-card-rounded-rect-node', name: '行式字母圆角', description: '行式层级字母卡圆角', category: 'compare', dataShape: 'compare', tags: ['对比', '圆角'] },
  { id: 'compare-hierarchy-left-right-circle-node-pill-badge', name: '左右圆胶囊', description: '左右圆节点胶囊徽标', category: 'compare', dataShape: 'compare', tags: ['对比', '左右'] },
  { id: 'compare-hierarchy-left-right-circle-node-plain-text', name: '左右圆文本', description: '左右圆节点纯文本', category: 'compare', dataShape: 'compare', tags: ['对比', '左右'] },
  { id: 'compare-swot', name: 'SWOT 分析', description: 'SWOT 四象限分析', category: 'compare', dataShape: 'compare', tags: ['SWOT', '四象限'] },
  { id: 'compare-quadrant-quarter-simple-card', name: '四象限卡', description: '四象限简约卡', category: 'compare', dataShape: 'compare', tags: ['四象限'] },
  { id: 'compare-quadrant-quarter-circular', name: '四象限圆弧', description: '四象限圆弧', category: 'compare', dataShape: 'compare', tags: ['四象限', '圆弧'] },
  { id: 'compare-quadrant-simple-illus', name: '四象限插画', description: '四象限插画', category: 'compare', dataShape: 'compare', tags: ['四象限', '插画'] },

  // ---------- hierarchy ----------
  { id: 'hierarchy-tree-tech-style-capsule-item', name: '树形科技胶囊', description: '科技风树形胶囊', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '科技'] },
  { id: 'hierarchy-tree-tech-style-compact-card', name: '树形科技紧凑', description: '科技风树形紧凑卡', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '科技', '紧凑'] },
  { id: 'hierarchy-tree-tech-style-rounded-rect-node', name: '树形科技圆角', description: '科技风树形圆角', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '科技', '圆角'] },
  { id: 'hierarchy-tree-tech-style-badge-card', name: '树形科技徽标', description: '科技风树形徽标卡', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '科技', '徽标'] },
  { id: 'hierarchy-tree-dashed-line-capsule-item', name: '树形虚线胶囊', description: '虚线连接树形胶囊', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '虚线'] },
  { id: 'hierarchy-tree-distributed-origin-capsule-item', name: '树形分布式', description: '分布式树形胶囊', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '分布式'] },
  { id: 'hierarchy-tree-curved-line-capsule-item', name: '树形曲线', description: '曲线连接树形胶囊', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '曲线'] },
  { id: 'hierarchy-tree-dashed-arrow-capsule-item', name: '树形虚箭头', description: '虚线箭头树形', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '箭头'] },
  { id: 'hierarchy-tree-lr-tech-style-capsule-item', name: '左右树形', description: '左右布局科技树形', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '左右'] },
  { id: 'hierarchy-tree-lr-dashed-line-capsule-item', name: '左右虚线树', description: '左右布局虚线树形', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '左右', '虚线'] },
  { id: 'hierarchy-tree-bt-tech-style-capsule-item', name: '底向树形', description: '底向布局科技树形', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '底向'] },
  { id: 'hierarchy-tree-rl-distributed-origin-capsule-item', name: '右向分布式', description: '右向分布式树形', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '右向'] },
  { id: 'hierarchy-tree-curved-line-badge-card', name: '曲线树徽标', description: '曲线连接树形徽标卡', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '曲线', '徽标'] },
  { id: 'hierarchy-tree-curved-line-compact-card', name: '曲线树紧凑', description: '曲线连接树形紧凑卡', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '曲线', '紧凑'] },
  { id: 'hierarchy-tree-curved-line-rounded-rect-node', name: '曲线树圆角', description: '曲线连接树形圆角', category: 'hierarchy', dataShape: 'hierarchy', tags: ['树形', '曲线', '圆角'] },

  // ---------- relation ----------
  { id: 'relation-network-simple-circle-node', name: '网络圆节点', description: '网络图简约圆节点', category: 'relation', dataShape: 'relation', tags: ['网络', '圆'] },
  { id: 'relation-network-icon-badge', name: '网络图标徽标', description: '网络图图标徽标', category: 'relation', dataShape: 'relation', tags: ['网络', '图标'] },
  { id: 'relation-circle-circular-progress', name: '环形进度关系', description: '环形进度式关系', category: 'relation', dataShape: 'relation', tags: ['环形', '进度'] },
  { id: 'relation-circle-icon-badge', name: '环形图标徽标', description: '环形布局图标徽标', category: 'relation', dataShape: 'relation', tags: ['环形', '图标'] },
  { id: 'relation-dagre-flow-tb-simple-circle-node', name: '纵向流程', description: '纵向 Dagre 流程图', category: 'relation', dataShape: 'relation', tags: ['Dagre', '纵向'] },
  { id: 'relation-dagre-flow-tb-compact-card', name: '纵向流程紧凑', description: '纵向 Dagre 紧凑卡', category: 'relation', dataShape: 'relation', tags: ['Dagre', '纵向', '紧凑'] },
  { id: 'relation-dagre-flow-tb-badge-card', name: '纵向流程徽标', description: '纵向 Dagre 徽标卡', category: 'relation', dataShape: 'relation', tags: ['Dagre', '纵向', '徽标'] },
  { id: 'relation-dagre-flow-lr-simple-circle-node', name: '横向流程', description: '横向 Dagre 流程图', category: 'relation', dataShape: 'relation', tags: ['Dagre', '横向'] },
  { id: 'relation-dagre-flow-lr-compact-card', name: '横向流程紧凑', description: '横向 Dagre 紧凑卡', category: 'relation', dataShape: 'relation', tags: ['Dagre', '横向', '紧凑'] },
  { id: 'relation-dagre-flow-tb-animated-capsule', name: '纵向动效胶囊', description: '纵向动效 Dagre 胶囊', category: 'relation', dataShape: 'relation', tags: ['Dagre', '动效', '胶囊'] },
  { id: 'relation-dagre-flow-lr-animated-capsule', name: '横向动效胶囊', description: '横向动效 Dagre 胶囊', category: 'relation', dataShape: 'relation', tags: ['Dagre', '动效', '胶囊'] },

  // ---------- chart ----------
  { id: 'chart-pie-plain-text', name: '饼图文本', description: '饼图带文本标签', category: 'chart', dataShape: 'list', tags: ['饼图'] },
  { id: 'chart-pie-compact-card', name: '饼图紧凑卡', description: '饼图紧凑卡片', category: 'chart', dataShape: 'list', tags: ['饼图', '紧凑'] },
  { id: 'chart-pie-pill-badge', name: '饼图胶囊', description: '饼图胶囊徽标', category: 'chart', dataShape: 'list', tags: ['饼图', '胶囊'] },
  { id: 'chart-pie-donut-plain-text', name: '环形图文本', description: '环形图带文本', category: 'chart', dataShape: 'list', tags: ['环形图'] },
  { id: 'chart-pie-donut-compact-card', name: '环形图紧凑', description: '环形图紧凑卡片', category: 'chart', dataShape: 'list', tags: ['环形图', '紧凑'] },
  { id: 'chart-pie-donut-pill-badge', name: '环形图胶囊', description: '环形图胶囊徽标', category: 'chart', dataShape: 'list', tags: ['环形图', '胶囊'] },
  { id: 'chart-column-simple', name: '柱状简约', description: '简约柱状图', category: 'chart', dataShape: 'list', tags: ['柱状'] },
  { id: 'chart-bar-plain-text', name: '条形文本', description: '条形图带文本', category: 'chart', dataShape: 'list', tags: ['条形'] },
  { id: 'chart-line-plain-text', name: '折线文本', description: '折线图带文本', category: 'chart', dataShape: 'list', tags: ['折线'] },
  { id: 'chart-wordcloud', name: '词云', description: '词云图', category: 'chart', dataShape: 'list', tags: ['词云'] },
  { id: 'chart-wordcloud-rotate', name: '旋转词云', description: '旋转式词云', category: 'chart', dataShape: 'list', tags: ['词云', '旋转'] },

  // ---------- quadrant ----------
  { id: 'quadrant-quarter-simple-card', name: '象限卡', description: '四象限简约卡', category: 'quadrant', dataShape: 'compare', tags: ['四象限'] },
  { id: 'quadrant-quarter-circular', name: '象限圆弧', description: '四象限圆弧', category: 'quadrant', dataShape: 'compare', tags: ['四象限', '圆弧'] },
  { id: 'quadrant-simple-illus', name: '象限插画', description: '四象限插画', category: 'quadrant', dataShape: 'compare', tags: ['四象限', '插画'] },
]

/** Group templates by category for the gallery */
export function groupTemplatesByCategory() {
  const groups: Record<InfographicTemplateCategory, TemplateMeta[]> = {
    list: [],
    sequence: [],
    compare: [],
    hierarchy: [],
    relation: [],
    chart: [],
    quadrant: [],
  }
  for (const t of TEMPLATE_REGISTRY) groups[t.category].push(t)
  return groups
}

/** Default sample data per data shape, so a freshly-picked template isn't empty */
export function defaultDataForShape(
  shape: TemplateMeta['dataShape']
): import('@/types/chart').InfographicData {
  if (shape === 'relation') {
    return {
      title: { text: '关系网络示例', subtext: '点击节点查看详情' },
      nodes: [
        { id: 'n1', label: '核心', group: 'A' },
        { id: 'n2', label: '节点 1', group: 'B' },
        { id: 'n3', label: '节点 2', group: 'B' },
        { id: 'n4', label: '节点 3', group: 'C' },
      ],
      edges: [
        { from: 'n1', to: 'n2', label: '连接' },
        { from: 'n1', to: 'n3', label: '连接' },
        { from: 'n2', to: 'n4', label: '连接' },
      ],
    }
  }
  if (shape === 'hierarchy') {
    return {
      title: { text: '层级结构示例', subtext: '可拖拽编辑节点' },
      lists: [
        {
          label: '根节点',
          desc: '顶层分类',
          children: [
            { label: '子节点 A', desc: '左侧分支' },
            { label: '子节点 B', desc: '右侧分支', children: [{ label: '叶节点 B1' }, { label: '叶节点 B2' }] },
          ],
        },
      ],
    }
  }
  if (shape === 'compare') {
    return {
      title: { text: '对比示例', subtext: '左右 / 四象限对比' },
      lists: [
        { label: '类别 A', desc: '描述 A', children: [{ label: '要点 A1' }, { label: '要点 A2' }, { label: '要点 A3' }] },
        { label: '类别 B', desc: '描述 B', children: [{ label: '要点 B1' }, { label: '要点 B2' }, { label: '要点 B3' }] },
      ],
    }
  }
  // list / chart
  return {
    title: { text: '列表示例', subtext: '点击右侧 + 添加条目' },
    lists: [
      { label: '第一项', desc: '简短说明文字', value: 80, icon: '🚀' },
      { label: '第二项', desc: '简短说明文字', value: 65, icon: '⭐' },
      { label: '第三项', desc: '简短说明文字', value: 50, icon: '🎯' },
      { label: '第四项', desc: '简短说明文字', value: 35, icon: '💡' },
    ],
  }
}
