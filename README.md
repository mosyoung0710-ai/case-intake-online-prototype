# 收案线上化交互原型

这是收案线上化改造的内部评审原型，当前用于患教端收案管理和销售部分问卷的页面演示。

## 在线预览

https://mosyoung0710-ai.github.io/case-intake-online-prototype/

## 文件说明

- `index.html`：原型页面入口
- `styles.css`：页面样式
- `app.js`：页面交互逻辑
- `registration-crm.css`、`registration-crm.js`：代注册和 CRM 客户池的增量样式与交互
- `validate-prototype.mjs`：本地浏览器验收脚本
- `validate-registration-crm.mjs`：代注册独立权限、表单、渠道映射与 CRM 列表验收
- `validation/`：本地验收截图

## 当前范围

- 患教端收案管理列表、待接收提醒、收案弹窗、代填抽屉
- 销售部分问卷页面和相关修改点说明
- App 金刚区独立权限“代注册”入口与单页注册表单
- CRM 客户池及用户渠道四类标记（本轮不搬 CRM 收案功能）

本地直接打开 `index.html` 即可预览；代注册创建和列表变化仅为当前页面内的演示数据，刷新或点击“重置演示”可恢复，不会创建真实账号。

## 说明

本仓库当前为公开仓库，已启用 GitHub Pages。
