import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE_PATH || "playwright");

const root = process.env.PROTOTYPE_ROOT;
if (!root) {
  throw new Error("Missing PROTOTYPE_ROOT");
}

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const validationDir = path.join(root, "validation");
fs.mkdirSync(validationDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true
});

const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const consoleErrors = [];
const failedRequests = [];

page.on("console", message => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", request => {
  failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`);
});

await page.goto(pathToFileURL(path.join(root, "index.html")).href, { waitUntil: "networkidle" });
const initialTableRows = await page.locator("#caseRows tr").count();
const initialTableScrollLeft = await page.locator(".data-table-wrap").evaluate(element => element.scrollLeft);
const firstIdHeaderVisible = await page.locator(".data-table th", { hasText: "收案ID" }).evaluate(element => {
  const rect = element.getBoundingClientRect();
  return rect.left >= 0 && rect.right <= window.innerWidth;
});
await page.screenshot({ path: path.join(validationDir, "01-list.png"), fullPage: true });

await page.getByRole("button", { name: "销售部分问卷" }).click();
const salesQuestionnaireVisible = await page.locator("#salesQuestionnaireView:not(.hidden)").count();
const salesNotesVisible = await page.locator("#notesPanel:not(.hidden)").count();
const salesNoteVisible = await page.locator('.note-card[data-note="sales-questionnaire"]:not(.hidden)').count();
const salesPatientEditableNoteVisible = await page.locator('.note-card[data-note="sales-questionnaire"]', { hasText: "患者填写时可继续修改销售已填内容。" }).count();
const salesHiddenQuestionNoteVisible = await page.locator('.note-card[data-note="sales-questionnaire"]', { hasText: "如果本页中未展示的题目，就算满足原有显隐逻辑，也不在销售部分展示，例如吸烟、饮酒。" }).count();
const healthcareNotesVisibleInSales = await page.locator('.note-card:not([data-note="sales-questionnaire"]):not(.hidden)').count();
const salesBrowserTopHidden = await page.locator(".browser-frame.sales-mode .browser-top").evaluate(element => getComputedStyle(element).display === "none" ? 1 : 0);
const salesAppTopbarHidden = await page.locator(".app-shell.sales-mode .app-topbar").evaluate(element => getComputedStyle(element).display === "none" ? 1 : 0);
const salesAddedTopicsTitleVisible = await page.locator("#salesQuestionnaireView .sales-added-topics h3", { hasText: "销售端新增以下题目" }).count();
const salesAddedTopicsCount = await page.locator("#salesQuestionnaireView .sales-added-topics li").count();
const salesRequiredFields = await page.locator("#salesQuestionnaireView strong").count();
const salesSubmitVisible = await page.locator("#salesQuestionnaireView .sales-submit", { hasText: "提交" }).count();
const salesFormBackground = await page.locator("#salesQuestionnaireView .sales-form").evaluate(element => getComputedStyle(element).backgroundColor);
const salesSectionBackground = await page.locator("#salesQuestionnaireView .sales-section").first().evaluate(element => getComputedStyle(element).backgroundColor);
const salesSubmitWarningDemoButtons = await page.locator("#salesQuestionnaireView [data-submit-warning]").count();
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(100);
const salesSubmitDemoFullyVisible = await page.locator("#salesQuestionnaireView .sales-submit-demo").evaluate(element => {
  const parentRect = element.closest(".sales-added-topics").getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const buttons = Array.from(element.querySelectorAll("button"));
  return rect.top >= parentRect.top && rect.bottom <= parentRect.bottom && buttons.every(button => {
    const buttonRect = button.getBoundingClientRect();
    return buttonRect.top >= parentRect.top && buttonRect.bottom <= parentRect.bottom;
  }) ? 1 : 0;
});
await page.setViewportSize({ width: 1440, height: 960 });
await page.waitForTimeout(100);
await page.locator("#salesQuestionnaireView .sales-submit").click();
const salesSubmitWarningTitleVisible = await page.locator("#salesSubmitWarning:not(.hidden)", { hasText: "温馨提醒" }).count();
const salesSubmitWarningIntensiveVisible = await page.locator("#salesSubmitWarning:not(.hidden)", { hasText: "该号码关联患者正处于密集照护中，需等待当前服务结案后再发起。" }).count();
await page.screenshot({ path: path.join(validationDir, "16-sales-submit-warning.png"), fullPage: true });
await page.locator("#salesSubmitWarning").getByRole("button", { name: "我知道了" }).click();
const salesSubmitWarningClosedAfterIntensive = await page.locator("#salesSubmitWarning.hidden").count();
await page.locator('[data-submit-warning="different-manager"]').click();
await page.locator("#salesQuestionnaireView .sales-submit").click();
const salesSubmitWarningOneVisible = await page.locator("#salesSubmitWarning:not(.hidden)", { hasText: "该号码已有其他经理提交的进行中任务，请核实！" }).count();
await page.locator("#salesSubmitWarning").getByRole("button", { name: "我知道了" }).click();
const salesSubmitWarningClosedByPrimary = await page.locator("#salesSubmitWarning.hidden").count();
await page.locator('[data-submit-warning="same-manager-same-name"]').click();
await page.locator("#salesQuestionnaireView .sales-submit").click();
const salesSubmitWarningTwoVisible = await page.locator("#salesSubmitWarning:not(.hidden)", { hasText: "检测到您已为该患者发起过收案任务，请修改后重新提交！" }).count();
await page.locator("#salesSubmitWarning").getByRole("button", { name: "关闭" }).click();
const salesSubmitWarningClosedByX = await page.locator("#salesSubmitWarning.hidden").count();
await page.locator('[data-submit-warning="same-manager-different-name"]').click();
await page.locator("#salesQuestionnaireView .sales-submit").click();
const salesSubmitWarningThreeVisible = await page.locator("#salesSubmitWarning:not(.hidden)", { hasText: "该号码已有正在进行的其他患者收案任务，请提供其他手机号，或等前序任务结束后再发起！" }).count();
await page.locator("#salesSubmitWarning").getByRole("button", { name: "我知道了" }).click();
const salesSubmitWarningClosedAfterAll = await page.locator("#salesSubmitWarning.hidden").count();
const logisticsFieldVisible = await page.locator("#salesQuestionnaireView", { hasText: "物流单号" }).count();
const userNameFieldVisible = await page.locator("#salesQuestionnaireView label", { hasText: "用户姓名" }).count();
const contactFieldVisible = await page.locator("#salesQuestionnaireView label", { hasText: "联系电话" }).count();
const pumpUserFieldVisible = await page.locator("#salesQuestionnaireView label", { hasText: "用泵人姓名（昵称）" }).count();
const glucoseTargetRateVisible = await page.locator("#salesQuestionnaireView label", { hasText: "最近血糖达标率" }).count();
const glucoseReportUploadVisible = await page.locator("#salesQuestionnaireView .upload-box", { hasText: "点击上传血糖报告、截图" }).count();
const glucoseReportUploadRequired = await page.locator("#salesQuestionnaireView .upload-box", { hasText: "点击上传血糖报告、截图" }).locator("strong").count();
const fieldNotesVisible = await page.locator("#salesQuestionnaireView .field-note").count();
const progressLabelVisible = await page.locator("#salesQuestionnaireView").evaluate(root => /(?:^|\D)\d+\/(?:24|25|26)(?:\D|$)/.test(root.textContent) ? 1 : 0);
const mealTimeFieldsVisible = await page.locator("#salesQuestionnaireView", { hasText: "早餐时间" }).count() + await page.locator("#salesQuestionnaireView", { hasText: "午餐时间" }).count() + await page.locator("#salesQuestionnaireView", { hasText: "晚餐时间" }).count();
const relatedInfoRequiredMarks = await page.locator("#salesQuestionnaireView .sales-section", { hasText: "三、相关信息" }).locator("strong").count();
const fieldNotesInsideScrollShell = await page.locator("#salesQuestionnaireView").evaluate(root => {
  const shell = root.querySelector(".sales-questionnaire-scroll-shell");
  return Array.from(root.querySelectorAll(".field-note")).every(note => shell.contains(note));
});
const salesFieldOrder = await page.locator("#salesQuestionnaireView").evaluate(root => {
  const selectors = ["label > span", ".sales-choice-row > span", ".sales-long-choice > span", ".sales-green-panel > b", ".upload-box", ".textarea-field > span"];
  const fields = Array.from(root.querySelectorAll(selectors.join(",")))
    .filter(element => !element.closest(".hidden"))
    .map(element => element.textContent.replace(/\s+/g, " ").trim().replace(/\s*\*$/, ""));
  const expected = [
    "业务经理",
    "用户姓名",
    "下单电话",
    "收件地址",
    "下单时间",
    "安装时间",
    "安装方式",
    "用户渠道",
    "服务类型",
    "泵型号",
    "AAPS安装设备",
    "手机型号",
    "售前备注",
    "联系电话",
    "用泵人姓名（昵称）",
    "出生日期",
    "性别",
    "身高（cm）",
    "体重（kg）",
    "糖尿病分型",
    "确诊时间",
    "当前治疗方案",
    "每日胰岛素用量和种类（泵）",
    "点击上传基础率分段截图(jpg、png)0/9张",
    "糖尿病并发症",
    "皮肤相关异常史",
    "血糖监测方式",
    "动态血糖仪品牌",
    "平均每月使用次数",
    "指尖血糖检测频率",
    "最近血糖达标率",
    "点击上传血糖报告、截图0/9张",
    "糖化血红蛋白 HbA1c",
    "检测日期",
    "检测结果(%)",
    "用泵/用AAPS闭环软件主要想改善的问题"
  ];
  const positions = expected.map(label => fields.findIndex(field => field.includes(label)));
  return {
    ok: positions.every(index => index >= 0) && positions.every((index, itemIndex) => itemIndex === 0 || index > positions[itemIndex - 1]),
    fields,
    expected,
    positions
  };
});
const phoneModelVisibleInitial = await page.locator('[data-toggle-target="aapsDevice"]:not(.hidden)', { hasText: "手机型号" }).count();
const watchModelHiddenInitial = await page.locator('[data-toggle-target="aapsDevice"].hidden', { hasText: "手表型号" }).count();
await page.locator('[data-toggle-group="aapsDevice"] button', { hasText: "手表" }).click();
const watchModelVisibleAfterClick = await page.locator('[data-toggle-target="aapsDevice"]:not(.hidden)', { hasText: "手表型号" }).count();
const phoneModelHiddenAfterClick = await page.locator('[data-toggle-target="aapsDevice"].hidden', { hasText: "手机型号" }).count();
await page.locator('[data-toggle-group="aapsDevice"] button', { hasText: "手机" }).click();
await page.locator('[data-toggle-group="complication"] button', { hasText: "有" }).click();
const complicationDetailVisible = await page.locator('[data-toggle-target="complication"]:not(.hidden)').count();
const complicationOptionVisible = await page.locator("#salesQuestionnaireView", { hasText: "视网膜病变" }).count();
const complicationRequiredMarks = await page.locator('[data-toggle-target="complication"] strong').count();
await page.locator('[data-toggle-group="skin"] button', { hasText: "有" }).click();
const skinDetailVisible = await page.locator('[data-toggle-target="skin"]:not(.hidden)').count();
const skinDetailFieldsVisible = await page.locator('[data-toggle-target="skin"]:not(.hidden)', { hasText: "过敏原" }).count();
const skinDetailRequiredMarks = await page.locator('[data-toggle-target="skin"] strong').count();
const pumpPanelVisibleInitial = await page.locator('[data-plan-panel="pump"]:not(.hidden)').count();
const penPanelHiddenInitial = await page.locator('[data-plan-panel="pen"].hidden').count();
await page.locator("#treatmentPlanSelect").selectOption("pen");
const penPanelVisibleAfterSelect = await page.locator('[data-plan-panel="pen"]:not(.hidden)').count();
const pumpPanelHiddenAfterSelect = await page.locator('[data-plan-panel="pump"].hidden').count();
await page.locator("#treatmentPlanSelect").selectOption("premix");
const penPanelVisibleAfterPremix = await page.locator('[data-plan-panel="pen"]:not(.hidden)').count();
const pumpPanelHiddenAfterPremix = await page.locator('[data-plan-panel="pump"].hidden').count();
const injectionOptions = await page.locator("#injectionCountSelect option").evaluateAll(options => options.map(option => option.textContent.trim()));
const injectionRowsInitial = await page.locator('.injection-dose-row:not(.hidden)').count();
await page.locator("#injectionCountSelect").selectOption("1");
const injectionRowsAfterOne = await page.locator('.injection-dose-row:not(.hidden)').count();
await page.locator("#injectionCountSelect").selectOption("0");
const injectionRowsAfterZero = await page.locator('.injection-dose-row:not(.hidden)').count();
await page.locator("#injectionCountSelect").selectOption("2");
await page.screenshot({ path: path.join(validationDir, "09-injection-times.png"), fullPage: true });
await page.locator("#treatmentPlanSelect").selectOption("pump");
const salesNewQuestionSections = await page.locator("#salesQuestionnaireView .sales-section").count();
await page.locator("#salesQuestionnaireView .sales-questionnaire-scroll-shell").evaluate(element => {
  element.scrollTop = 0;
});
await page.screenshot({ path: path.join(validationDir, "08-sales-questionnaire.png"), fullPage: true });
const salesQuestionnaireScrollShellVisible = await page.locator("#salesQuestionnaireView .sales-questionnaire-scroll-shell").count();
const salesQuestionnaireShellScrollable = await page.locator("#salesQuestionnaireView .sales-questionnaire-scroll-shell").evaluate(element => element.scrollHeight > element.clientHeight ? 1 : 0);
const salesQuestionnaireViewPageSized = await page.locator("#salesQuestionnaireView").evaluate(element => {
  const rect = element.getBoundingClientRect();
  return rect.bottom <= window.innerHeight ? 1 : 0;
});
await page.locator("#salesQuestionnaireView .sales-questionnaire-scroll-shell").evaluate(element => {
  element.scrollTop = element.scrollHeight;
});
await page.waitForTimeout(100);
const salesAddedTopicsVisibleAfterInternalScroll = await page.locator("#salesQuestionnaireView .sales-added-topics").evaluate(element => {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight ? 1 : 0;
});
const salesQuestionnaireNoteVisibleAfterInternalScroll = await page.locator('.note-card[data-note="sales-questionnaire"]').evaluate(element => {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight ? 1 : 0;
});
await page.screenshot({ path: path.join(validationDir, "17-sales-questionnaire-scroll-shell.png"), fullPage: true });
await page.locator("#salesQuestionnaireView .sales-questionnaire-scroll-shell").evaluate(element => {
  element.scrollTop = 0;
});

await page.getByRole("button", { name: "销售 App 端" }).click();
const salesAppVisible = await page.locator("#salesAppView:not(.hidden)").count();
const salesAppNoteVisible = await page.locator('.note-card[data-note="sales-app"]:not(.hidden)').count();
const salesAppQuestionnaireHidden = await page.locator("#salesQuestionnaireView.hidden").count();
const salesAppHealthcareNotesVisible = await page.locator('.note-card:not([data-note="sales-app"]):not(.hidden)').count();
const salesAppPhoneVisible = await page.locator("#salesAppView .sales-phone").count();
const salesAppUserCards = await page.locator("#salesAppView .sales-user-card").count();
const salesAppNewCaseButtons = await page.locator("#salesAppView .sales-user-actions button", { hasText: "新收案" }).count();
const salesAppManagementButtons = await page.locator("#salesAppView .sales-user-actions button", { hasText: "收案管理" }).count();
const salesAppUserDetailPageCount = await page.locator('[data-sales-app-page="user-detail"]').count();
const salesAppUserActionDescriptions = await page.locator("#salesAppView", { hasText: "填写销售部分问卷" }).count() + await page.locator("#salesAppView", { hasText: "查看历史收案记录" }).count();
const salesAppUsersTitle = await page.locator("#salesAppTitle").innerText();
const salesAppSummaryCardCount = await page.locator("#salesAppView .sales-summary-card").count();
const salesAppUserTotalVisible = await page.locator("#salesAppView", { hasText: "共 65,244 位用户" }).count();
const salesAppSearchFilterVisible = await page.locator("#salesAppView .app-search-filter", { hasText: "昵称" }).count();
const salesAppSearchPlaceholder = await page.locator("#salesAppView .app-search input").getAttribute("placeholder");
const salesAppSearchHintVisible = await page.locator("#salesAppView", { hasText: "可模糊查询昵称、ID、电话" }).count();
const salesAppSearchButtonVisible = await page.locator("#salesAppView .app-search-submit").count() + await page.locator("#salesAppView .app-search button", { hasText: "搜索" }).count();
await page.locator("#salesAppView .app-search-filter").click();
const salesAppSearchMenuOptions = await page.locator("#salesAppView [data-search-menu] button").evaluateAll(buttons => buttons.map(button => button.textContent.trim()).join(","));
await page.screenshot({ path: path.join(validationDir, "10-sales-app-users-search-menu.png"), fullPage: true });
await page.locator("#salesAppView [data-search-filter='电话']").click();
const salesAppSearchFilterAfterSelect = await page.locator("#salesAppView [data-search-filter-label]").innerText();
const salesAppSearchMenuHiddenAfterSelect = await page.locator("#salesAppView [data-search-menu].hidden").count();
await page.locator("#salesAppView .app-search-filter").click();
await page.locator("#salesAppView [data-search-filter='昵称']").click();
const salesAppUserIdsVisible = await page.locator("#salesAppView .sales-user-card strong", { hasText: "(65500)" }).count() + await page.locator("#salesAppView .sales-user-card strong", { hasText: "(65501)" }).count() + await page.locator("#salesAppView .sales-user-card strong", { hasText: "(65502)" }).count();
const salesAppUserPhoneRows = await page.locator("#salesAppView .sales-user-card small", { hasText: "手机号：" }).count();
const salesAppUserFollowerRows = await page.locator("#salesAppView .sales-user-card small", { hasText: "跟进人：" }).count();
const salesAppUnreceivedProgress = await page.locator("#salesAppView .sales-user-card p", { hasText: "收案进度：--" }).count();
await page.screenshot({ path: path.join(validationDir, "10-sales-app-users.png"), fullPage: true });
await page.locator("#salesAppView .sales-user-card").first().getByRole("button", { name: "收案管理" }).click();
const salesAppCaseListTitle = await page.locator("#salesAppTitle").innerText();
const salesAppCaseRecords = await page.locator("#salesAppView .app-case-record:not(.hidden)").count();
const salesAppCaseListFields = await page.locator("#salesAppView", { hasText: "下单日期" }).count() + await page.locator("#salesAppView", { hasText: "提交时间" }).count() + await page.locator("#salesAppView", { hasText: "泵型号" }).count() + await page.locator("#salesAppView", { hasText: "当前状态" }).count();
const salesAppCaseListDeleteButtons = await page.locator("#salesAppView .app-case-record:not(.hidden) .danger-text", { hasText: "删除" }).count();
const salesAppCaseListDetailButtons = await page.locator("#salesAppView .app-case-record:not(.hidden) button", { hasText: "详情" }).count();
const salesAppCaseListEditButtons = await page.locator("#salesAppView .app-case-record:not(.hidden) button", { hasText: "编辑" }).count();
const salesAppCaseStatusesVisible = await page.locator("#salesAppView", { hasText: "当前状态：待接收" }).count() + await page.locator("#salesAppView", { hasText: "当前状态：已接收" }).count() + await page.locator("#salesAppView", { hasText: "当前状态：待用户填写" }).count() + await page.locator("#salesAppView", { hasText: "当前状态：用户填写中" }).count() + await page.locator("#salesAppView", { hasText: "当前状态：用户已填写" }).count() + await page.locator("#salesAppView", { hasText: "当前状态：已收案" }).count();
const salesAppCaseEnabledEditButtons = await page.locator("#salesAppView .app-case-record:not(.hidden) button:not([disabled])", { hasText: "编辑" }).count();
const salesAppCaseDisabledEditButtons = await page.locator("#salesAppView .app-case-record:not(.hidden) button[disabled]", { hasText: "编辑" }).count();
const salesAppCaseEnabledDeleteButtons = await page.locator("#salesAppView .app-case-record:not(.hidden) button:not([disabled])", { hasText: "删除" }).count();
const salesAppCaseDisabledDeleteButtons = await page.locator("#salesAppView .app-case-record:not(.hidden) button[disabled]", { hasText: "删除" }).count();
await page.screenshot({ path: path.join(validationDir, "11-sales-app-case-list.png"), fullPage: true });
await page.locator("#salesAppBack").click();
const salesAppBackToUsersTitle = await page.locator("#salesAppTitle").innerText();
const salesAppBackToUsersCards = await page.locator("#salesAppView .sales-user-card").count();
await page.locator("#salesAppView .sales-user-card").first().getByRole("button", { name: "收案管理" }).click();
await page.locator("#salesAppView .app-case-record:not(.hidden)").first().getByRole("button", { name: "编辑" }).click();
const salesAppEditTitleFromList = await page.locator("#salesAppTitle").innerText();
await page.locator("#salesAppBack").click();
const salesAppBackFromEditTitle = await page.locator("#salesAppTitle").innerText();
await page.locator("#salesAppView .app-case-record").first().getByRole("button", { name: "详情" }).click();
const salesAppDetailTitle = await page.locator("#salesAppTitle").innerText();
const salesAppDetailFields = await page.locator("#salesAppView", { hasText: "业务经理" }).count() + await page.locator("#salesAppView", { hasText: "用户填写部分" }).count();
const salesAppDetailDeleteButtons = await page.locator('[data-sales-app-page="case-detail"] .danger-text', { hasText: "删除" }).count();
const salesAppDetailEditButtons = await page.locator('[data-sales-app-page="case-detail"] button', { hasText: "编辑" }).count();
await page.screenshot({ path: path.join(validationDir, "12-sales-app-detail.png"), fullPage: true });
await page.locator("#salesAppBack").click();
await page.locator("#salesAppView .app-case-record:not(.hidden)").first().getByRole("button", { name: "编辑" }).click();
const salesAppEditTitle = await page.locator("#salesAppTitle").innerText();
const salesAppEditFields = await page.locator("#salesAppView .app-edit-card label").count();
await page.screenshot({ path: path.join(validationDir, "13-sales-app-edit.png"), fullPage: true });
await page.locator("#salesAppView button", { hasText: "保存" }).click();
await page.locator("#salesAppView .app-case-record:not(.hidden)").first().getByRole("button", { name: "删除" }).click();
const salesAppDeleteTitle = await page.locator("#salesAppTitle").innerText();
const salesAppDeleteConfirmVisible = await page.locator("#appDeleteSheet:not(.hidden) .app-confirm-card", { hasText: "确认删除本次收案？" }).count();
await page.screenshot({ path: path.join(validationDir, "14-sales-app-delete.png"), fullPage: true });
await page.locator("#appDeleteSheet").getByRole("button", { name: "取消" }).click();
const salesAppDeleteCancelTitle = await page.locator("#salesAppTitle").innerText();
const salesAppDeleteConfirmHiddenAfterCancel = await page.locator("#appDeleteSheet.hidden").count();
await page.locator("#salesAppView .app-case-record:not(.hidden)").first().getByRole("button", { name: "删除" }).click();
await page.locator("#appDeleteSheet").getByRole("button", { name: "确认删除" }).click();
const salesAppCaseRecordsAfterDelete = await page.locator("#salesAppView .app-case-record:not(.hidden)").count();
await page.locator("#resetDemo").click();
await page.getByRole("button", { name: "销售 App 端" }).click();
await page.locator("#salesAppView .sales-user-card").first().getByRole("button", { name: "收案管理" }).click();
const salesAppCaseRecordsAfterReset = await page.locator("#salesAppView .app-case-record:not(.hidden)").count();
await page.locator("#salesAppBack").click();
await page.locator("#salesAppView .sales-user-card").first().getByRole("button", { name: "新收案" }).click();
const salesAppNewCaseJumpVisible = await page.locator("#salesQuestionnaireView:not(.hidden)").count();
const salesAppNewCaseJumpActiveNav = await page.locator(".nav-item.active").innerText();

await page.getByRole("button", { name: "系统通知" }).click();
const systemNoticeVisible = await page.locator("#systemNoticeView:not(.hidden)").count();
const systemNoticeActiveNav = await page.locator(".nav-item.active").innerText();
const systemNoticeTitle = await page.locator("#systemNoticeView .sales-app-header strong").innerText();
const systemNoticeMessageVisible = await page.locator("#systemNoticeView .intake-notice-message", { hasText: "患教已接收患者【JJ】（ID：56）。" }).count();
const systemNoticeNoteVisible = await page.locator('.note-card[data-note="sales-notice"]:not(.hidden)').count();
const systemNoticeOtherNotesVisible = await page.locator('.note-card:not([data-note="sales-notice"]):not(.hidden)').count();
const systemNoticeSalesAppHidden = await page.locator("#salesAppView.hidden").count();
const systemNoticeQuestionnaireHidden = await page.locator("#salesQuestionnaireView.hidden").count();
await page.waitForTimeout(1700);
await page.screenshot({ path: path.join(validationDir, "15-system-notice.png"), fullPage: true });

await page.getByRole("button", { name: "收案管理" }).click();
const listBrowserTopVisible = await page.locator(".browser-top").evaluate(element => getComputedStyle(element).display !== "none" ? 1 : 0);
const listNotesVisible = await page.locator("#notesPanel:not(.hidden)").count();
const salesNoteHiddenInList = await page.locator('.note-card[data-note="sales-questionnaire"].hidden').count();
const salesAppNoteHiddenInList = await page.locator('.note-card[data-note="sales-app"].hidden').count();
const removedStatusText = ["待", "用户", "填写"].join("");
const removedStatusVisible = await page.locator("#caseManagementView", { hasText: removedStatusText }).count();
const noticeNavVisible = await page.locator('.nav-item[data-view="notice"]').count();
const noticeBannerVisible = await page.locator("#topNotice").count();
const stationMailVisible = await page.locator("#stationMailDialog").count();
const pendingDotInitial = await page.locator("#pendingDot:not(.hidden)").count();
const pendingDotTextInitial = await page.locator("#pendingDot").innerText();
const copyActionButtons = await page.locator('button[data-action="copy"]').count();
await page.locator('button[data-action="copy"]').first().click();
const enabledConfirmButtonsBefore = await page.locator('button[data-action="confirm"]:not([disabled])').count();
while (await page.locator('button[data-action="confirm"]:not([disabled])').count() > 0) {
  await page.locator('button[data-action="confirm"]:not([disabled])').first().click();
}
const enabledConfirmButtonsAfter = await page.locator('button[data-action="confirm"]:not([disabled])').count();
const disabledConfirmButtonsAfter = await page.locator('button[data-action="confirm"][disabled]').count();
const pendingDotAfterAllConfirm = await page.locator("#pendingDot.hidden").count();
const pendingDotTextAfterAllConfirm = await page.locator("#pendingDot").innerText();
const firstConfirmedStatus = await page.locator("#caseRows tr", { hasText: "78" }).locator(".status").innerText();
await page.screenshot({ path: path.join(validationDir, "02-notice-confirmed.png"), fullPage: true });

const enabledPushButtons = await page.locator('button[data-action="push"]:not([disabled])').count();
const enabledAutofillButtons = await page.locator('button[data-action="autofill"]:not([disabled])').count();
const disabledAutofillButtons = await page.locator('button[data-action="autofill"][disabled]').count();
const enabledDeleteButtons = await page.locator('button[data-action="delete"]:not([disabled])').count();
const disabledDeleteButtons = await page.locator('button[data-action="delete"][disabled]').count();
const prepButtons = await page.getByRole("button", { name: "收案准备", exact: true }).count();
const processButtons = await page.getByRole("button", { name: "处理收案", exact: true }).count();
const disabledProcessButtons = await page.locator('button[data-action="receive"][disabled]', { hasText: "处理收案" }).count();
const finishedActionButtons = await page.locator('button[data-action="receive"]', { hasText: "已收案" }).count();
const receiveActionButtons = await page.locator('button[data-action="receive"]').count();
await page.locator('button[data-action="autofill"]:not([disabled])').first().click();
const autofillSalesSectionVisible = await page.locator("#autofillDrawer .drawer-section", { hasText: "销售部分" }).count();
await page.locator("#autofillName").fill("用户代填演示");
await page.screenshot({ path: path.join(validationDir, "05-autofill-drawer.png"), fullPage: true });
await page.getByRole("button", { name: "下一页" }).click();
await page.locator("#closeAutofill").click();

await page.locator('button[data-action="receive"][data-id="68"]').click();
await page.getByRole("button", { name: "创建，下一步" }).click();
await page.locator("#closeReceive").click();
await page.locator('button[data-action="receive"][data-id="68"]').click();
const reopenedPrepStep = await page.locator("#stepName").innerText();
const prepQuestionnaireLinkVisible = await page.locator(".questionnaire-link:not(.hidden)").count();
const prepQuestionnaireResultsVisible = await page.locator(".questionnaire-result:not(.hidden)").count();
const trialUserControlCount = await page.getByLabel("试戴用户，无需创建群聊").count();
const prevStepButtonCount = await page.getByRole("button", { name: "上一步" }).count();
await page.screenshot({ path: path.join(validationDir, "03-prepare-step3.png"), fullPage: true });
await page.getByRole("button", { name: "完成准备" }).click();
await page.waitForSelector("#receiveModal.hidden", { state: "attached" });

await page.locator('button[data-action="receive"][data-id="45"]').click();
const trialPrepStep = await page.locator("#stepName").innerText();
const trialVisiblePrepareSteps = await page.locator('.step[data-mode="prepare"]:not(.hidden)').count();
const trialGroupBodyVisible = await page.locator('[data-step-body="3"]:not(.hidden)').count();
const trialFinishButtonVisible = await page.getByRole("button", { name: "完成准备" }).count();
await page.screenshot({ path: path.join(validationDir, "07-trial-prepare.png"), fullPage: true });
await page.locator("#closeReceive").click();

await page.locator('button[data-action="receive"][data-id="15"]').click();
const processStep = await page.locator("#stepName").innerText();
const visiblePrepareStepsInProcess = await page.locator('.step[data-mode="prepare"]:not(.hidden)').count();
const processStepperHidden = await page.locator("#stepper.hidden").count();
const processQuestionnaireLinkVisible = await page.locator(".questionnaire-link:not(.hidden)").count();
const processQuestionnaireResultsVisible = await page.locator(".questionnaire-result:not(.hidden)").count();
await page.screenshot({ path: path.join(validationDir, "06-process-check.png"), fullPage: true });
await page.getByRole("button", { name: "完成收案" }).click();

await page.locator('button[data-action="push"]:not([disabled])').first().click();
await page.screenshot({ path: path.join(validationDir, "04-push-finished.png"), fullPage: true });

const activeNav = await page.locator(".nav-item.active").innerText();
const tableRows = await page.locator("#caseRows tr").count();
const visibleToast = await page.locator("#toast:not(.hidden)").count();
const autofillDrawerHidden = await page.locator("#autofillDrawer.hidden").count();

await browser.close();

console.log(JSON.stringify({
  ok: consoleErrors.length === 0 && failedRequests.length === 0 && initialTableRows >= 8 && initialTableScrollLeft === 0 && firstIdHeaderVisible === true && tableRows >= 8 && salesQuestionnaireVisible === 1 && salesNotesVisible === 1 && salesNoteVisible === 1 && salesPatientEditableNoteVisible === 1 && salesHiddenQuestionNoteVisible === 1 && healthcareNotesVisibleInSales === 0 && salesBrowserTopHidden === 1 && salesAppTopbarHidden === 1 && salesAddedTopicsTitleVisible === 1 && salesAddedTopicsCount === 19 && salesQuestionnaireScrollShellVisible === 1 && salesQuestionnaireShellScrollable === 1 && salesQuestionnaireViewPageSized === 1 && salesAddedTopicsVisibleAfterInternalScroll === 1 && salesQuestionnaireNoteVisibleAfterInternalScroll === 1 && salesAppVisible === 1 && salesAppNoteVisible === 1 && salesAppQuestionnaireHidden === 1 && salesAppHealthcareNotesVisible === 0 && salesAppPhoneVisible === 1 && salesAppUsersTitle === "客户池" && salesAppSummaryCardCount === 0 && salesAppUserTotalVisible === 0 && salesAppSearchFilterVisible === 1 && salesAppSearchPlaceholder === null && salesAppSearchHintVisible === 0 && salesAppSearchButtonVisible === 0 && salesAppSearchMenuOptions === "昵称,ID,电话" && salesAppSearchFilterAfterSelect === "电话" && salesAppSearchMenuHiddenAfterSelect === 1 && salesAppUserIdsVisible === 3 && salesAppUserPhoneRows === 3 && salesAppUserFollowerRows === 3 && salesAppUnreceivedProgress === 1 && salesAppUserCards === 3 && salesAppNewCaseButtons === 3 && salesAppManagementButtons === 3 && salesAppUserDetailPageCount === 0 && salesAppUserActionDescriptions === 0 && salesAppCaseListTitle === "收案管理" && salesAppCaseRecords === 6 && salesAppCaseListFields >= 4 && salesAppCaseListDeleteButtons === salesAppCaseRecords && salesAppCaseListDetailButtons === salesAppCaseRecords && salesAppCaseListEditButtons === salesAppCaseRecords && salesAppCaseStatusesVisible === 6 && salesAppCaseEnabledEditButtons === 3 && salesAppCaseDisabledEditButtons === 3 && salesAppCaseEnabledDeleteButtons === 1 && salesAppCaseDisabledDeleteButtons === 5 && salesAppBackToUsersTitle === "客户池" && salesAppBackToUsersCards === 3 && salesAppEditTitleFromList === "编辑收案" && salesAppBackFromEditTitle === "收案管理" && salesAppDetailTitle === "问卷详情" && salesAppDetailFields >= 2 && salesAppDetailDeleteButtons === 0 && salesAppDetailEditButtons === 0 && salesAppEditTitle === "编辑收案" && salesAppEditFields === 5 && salesAppDeleteTitle === "收案管理" && salesAppDeleteConfirmVisible === 1 && salesAppDeleteCancelTitle === "收案管理" && salesAppDeleteConfirmHiddenAfterCancel === 1 && salesAppCaseRecordsAfterDelete === salesAppCaseRecords - 1 && salesAppCaseRecordsAfterReset === salesAppCaseRecords && salesAppNewCaseJumpVisible === 1 && salesAppNewCaseJumpActiveNav === "销售部分问卷" && systemNoticeVisible === 1 && systemNoticeActiveNav === "系统通知" && systemNoticeTitle === "系统通知" && systemNoticeMessageVisible === 1 && systemNoticeNoteVisible === 1 && systemNoticeOtherNotesVisible === 0 && systemNoticeSalesAppHidden === 1 && systemNoticeQuestionnaireHidden === 1 && listBrowserTopVisible === 1 && listNotesVisible === 1 && salesNoteHiddenInList === 1 && salesAppNoteHiddenInList === 1 && removedStatusVisible === 0 && noticeNavVisible === 0 && noticeBannerVisible === 0 && stationMailVisible === 0 && pendingDotInitial === 1 && pendingDotTextInitial === "2" && pendingDotAfterAllConfirm === 1 && pendingDotTextAfterAllConfirm === "" && copyActionButtons === tableRows && enabledConfirmButtonsBefore === 2 && enabledConfirmButtonsAfter === 0 && disabledConfirmButtonsAfter === tableRows && firstConfirmedStatus === "已接收" && salesRequiredFields >= 25 && salesSubmitVisible === 1 && salesFormBackground === "rgb(243, 244, 248)" && salesSectionBackground === salesFormBackground && salesSubmitWarningDemoButtons === 4 && salesSubmitDemoFullyVisible === 1 && salesSubmitWarningTitleVisible === 1 && salesSubmitWarningOneVisible === 1 && salesSubmitWarningClosedByPrimary === 1 && salesSubmitWarningIntensiveVisible === 1 && salesSubmitWarningClosedAfterIntensive === 1 && salesSubmitWarningTwoVisible === 1 && salesSubmitWarningClosedByX === 1 && salesSubmitWarningThreeVisible === 1 && salesSubmitWarningClosedAfterAll === 1 && logisticsFieldVisible === 0 && userNameFieldVisible === 1 && contactFieldVisible === 1 && pumpUserFieldVisible === 1 && glucoseTargetRateVisible === 1 && glucoseReportUploadVisible === 1 && glucoseReportUploadRequired === 0 && fieldNotesVisible === 6 && progressLabelVisible === 0 && mealTimeFieldsVisible === 0 && relatedInfoRequiredMarks === 4 && fieldNotesInsideScrollShell === true && salesFieldOrder.ok === true && phoneModelVisibleInitial === 1 && watchModelHiddenInitial === 1 && watchModelVisibleAfterClick === 1 && phoneModelHiddenAfterClick === 1 && complicationDetailVisible === 1 && complicationOptionVisible === 1 && complicationRequiredMarks === 0 && skinDetailVisible === 1 && skinDetailFieldsVisible === 1 && skinDetailRequiredMarks === 0 && pumpPanelVisibleInitial === 1 && penPanelHiddenInitial === 1 && penPanelVisibleAfterSelect === 1 && pumpPanelHiddenAfterSelect === 1 && penPanelVisibleAfterPremix === 1 && pumpPanelHiddenAfterPremix === 1 && injectionOptions.join(",") === "0次,1次,2次" && injectionRowsInitial === 2 && injectionRowsAfterOne === 1 && injectionRowsAfterZero === 0 && salesNewQuestionSections === 3 && enabledPushButtons === 7 && enabledAutofillButtons === 6 && disabledAutofillButtons === 2 && enabledDeleteButtons === 1 && disabledDeleteButtons === 7 && prepButtons === 6 && processButtons === 2 && disabledProcessButtons === 1 && finishedActionButtons === 0 && receiveActionButtons === tableRows && autofillSalesSectionVisible === 0 && reopenedPrepStep === "创建群聊" && trialUserControlCount === 0 && prevStepButtonCount === 0 && trialPrepStep === "创建看板" && trialVisiblePrepareSteps === 1 && trialGroupBodyVisible === 0 && trialFinishButtonVisible === 1 && processStep === "信息核对" && visiblePrepareStepsInProcess === 0 && processStepperHidden === 1 && prepQuestionnaireLinkVisible === 0 && prepQuestionnaireResultsVisible === 2 && processQuestionnaireLinkVisible === 0 && processQuestionnaireResultsVisible === 2 && autofillDrawerHidden === 1,
  initialTableRows,
  initialTableScrollLeft,
  firstIdHeaderVisible,
  activeNav,
  tableRows,
  salesQuestionnaireVisible,
  salesNotesVisible,
  salesNoteVisible,
  salesPatientEditableNoteVisible,
  salesHiddenQuestionNoteVisible,
  healthcareNotesVisibleInSales,
  salesBrowserTopHidden,
  salesAppTopbarHidden,
  salesAddedTopicsTitleVisible,
  salesAddedTopicsCount,
  salesQuestionnaireScrollShellVisible,
  salesQuestionnaireShellScrollable,
  salesQuestionnaireViewPageSized,
  salesAddedTopicsVisibleAfterInternalScroll,
  salesQuestionnaireNoteVisibleAfterInternalScroll,
  listBrowserTopVisible,
  listNotesVisible,
  salesNoteHiddenInList,
  salesAppNoteHiddenInList,
  removedStatusVisible,
  noticeNavVisible,
  noticeBannerVisible,
  stationMailVisible,
  pendingDotInitial,
  pendingDotTextInitial,
  pendingDotAfterAllConfirm,
  pendingDotTextAfterAllConfirm,
  copyActionButtons,
  enabledConfirmButtonsBefore,
  enabledConfirmButtonsAfter,
  disabledConfirmButtonsAfter,
  firstConfirmedStatus,
  salesRequiredFields,
  salesSubmitVisible,
  salesFormBackground,
  salesSectionBackground,
  salesSubmitWarningDemoButtons,
  salesSubmitDemoFullyVisible,
  salesSubmitWarningTitleVisible,
  salesSubmitWarningOneVisible,
  salesSubmitWarningClosedByPrimary,
  salesSubmitWarningIntensiveVisible,
  salesSubmitWarningClosedAfterIntensive,
  salesSubmitWarningTwoVisible,
  salesSubmitWarningClosedByX,
  salesSubmitWarningThreeVisible,
  salesSubmitWarningClosedAfterAll,
  logisticsFieldVisible,
  userNameFieldVisible,
  contactFieldVisible,
  pumpUserFieldVisible,
  glucoseTargetRateVisible,
  glucoseReportUploadVisible,
  glucoseReportUploadRequired,
  fieldNotesVisible,
  progressLabelVisible,
  mealTimeFieldsVisible,
  relatedInfoRequiredMarks,
  fieldNotesInsideScrollShell,
  salesFieldOrder,
  phoneModelVisibleInitial,
  watchModelHiddenInitial,
  watchModelVisibleAfterClick,
  phoneModelHiddenAfterClick,
  complicationDetailVisible,
  complicationOptionVisible,
  complicationRequiredMarks,
  skinDetailVisible,
  skinDetailFieldsVisible,
  skinDetailRequiredMarks,
  pumpPanelVisibleInitial,
  penPanelHiddenInitial,
  penPanelVisibleAfterSelect,
  pumpPanelHiddenAfterSelect,
  penPanelVisibleAfterPremix,
  pumpPanelHiddenAfterPremix,
  injectionOptions,
  injectionRowsInitial,
  injectionRowsAfterOne,
  injectionRowsAfterZero,
  salesNewQuestionSections,
  salesAppVisible,
  salesAppNoteVisible,
  salesAppQuestionnaireHidden,
  salesAppHealthcareNotesVisible,
  salesAppPhoneVisible,
  salesAppUsersTitle,
  salesAppSummaryCardCount,
  salesAppUserTotalVisible,
  salesAppSearchFilterVisible,
  salesAppSearchPlaceholder,
  salesAppSearchHintVisible,
  salesAppSearchButtonVisible,
  salesAppSearchMenuOptions,
  salesAppSearchFilterAfterSelect,
  salesAppSearchMenuHiddenAfterSelect,
  salesAppUserIdsVisible,
  salesAppUserPhoneRows,
  salesAppUserFollowerRows,
  salesAppUnreceivedProgress,
  salesAppUserCards,
  salesAppNewCaseButtons,
  salesAppManagementButtons,
  salesAppUserDetailPageCount,
  salesAppUserActionDescriptions,
  salesAppCaseListTitle,
  salesAppCaseRecords,
  salesAppCaseListFields,
  salesAppCaseListDeleteButtons,
  salesAppCaseListDetailButtons,
  salesAppCaseListEditButtons,
  salesAppCaseStatusesVisible,
  salesAppCaseEnabledEditButtons,
  salesAppCaseDisabledEditButtons,
  salesAppCaseEnabledDeleteButtons,
  salesAppCaseDisabledDeleteButtons,
  salesAppBackToUsersTitle,
  salesAppBackToUsersCards,
  salesAppEditTitleFromList,
  salesAppBackFromEditTitle,
  salesAppDetailTitle,
  salesAppDetailFields,
  salesAppDetailDeleteButtons,
  salesAppDetailEditButtons,
  salesAppEditTitle,
  salesAppEditFields,
  salesAppDeleteTitle,
  salesAppDeleteConfirmVisible,
  salesAppDeleteCancelTitle,
  salesAppDeleteConfirmHiddenAfterCancel,
  salesAppCaseRecordsAfterDelete,
  salesAppCaseRecordsAfterReset,
  salesAppNewCaseJumpVisible,
  salesAppNewCaseJumpActiveNav,
  systemNoticeVisible,
  systemNoticeActiveNav,
  systemNoticeTitle,
  systemNoticeMessageVisible,
  systemNoticeNoteVisible,
  systemNoticeOtherNotesVisible,
  systemNoticeSalesAppHidden,
  systemNoticeQuestionnaireHidden,
  enabledPushButtons,
  enabledAutofillButtons,
  disabledAutofillButtons,
  enabledDeleteButtons,
  disabledDeleteButtons,
  prepButtons,
  processButtons,
  disabledProcessButtons,
  finishedActionButtons,
  receiveActionButtons,
  autofillSalesSectionVisible,
  reopenedPrepStep,
  trialUserControlCount,
  prevStepButtonCount,
  trialPrepStep,
  trialVisiblePrepareSteps,
  trialGroupBodyVisible,
  trialFinishButtonVisible,
  prepQuestionnaireLinkVisible,
  prepQuestionnaireResultsVisible,
  processStep,
  visiblePrepareStepsInProcess,
  processStepperHidden,
  processQuestionnaireLinkVisible,
  processQuestionnaireResultsVisible,
  autofillDrawerHidden,
  visibleToast,
  consoleErrors,
  failedRequests,
  screenshots: [
    "validation/01-list.png",
    "validation/02-notice-confirmed.png",
    "validation/03-prepare-step3.png",
    "validation/04-push-finished.png",
    "validation/05-autofill-drawer.png",
    "validation/06-process-check.png",
    "validation/07-trial-prepare.png",
    "validation/08-sales-questionnaire.png",
    "validation/09-injection-times.png",
    "validation/10-sales-app-users.png",
    "validation/10-sales-app-users-search-menu.png",
    "validation/11-sales-app-case-list.png",
    "validation/12-sales-app-detail.png",
    "validation/13-sales-app-edit.png",
    "validation/14-sales-app-delete.png",
    "validation/15-system-notice.png",
    "validation/16-sales-submit-warning.png",
    "validation/17-sales-questionnaire-scroll-shell.png"
  ]
}, null, 2));
