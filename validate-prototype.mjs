import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("C:\\Users\\ASUS\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright");

const root = process.env.PROTOTYPE_ROOT;
if (!root) {
  throw new Error("Missing PROTOTYPE_ROOT");
}

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
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
const logisticsFieldVisible = await page.locator("#salesQuestionnaireView", { hasText: "物流单号" }).count();
const userNameFieldVisible = await page.locator("#salesQuestionnaireView label", { hasText: "用户姓名" }).count();
const contactFieldVisible = await page.locator("#salesQuestionnaireView label", { hasText: "联系电话" }).count();
const pumpUserFieldVisible = await page.locator("#salesQuestionnaireView label", { hasText: "用泵人姓名（昵称）" }).count();
const glucoseTargetRateVisible = await page.locator("#salesQuestionnaireView label", { hasText: "最近血糖达标率" }).count();
const glucoseReportUploadVisible = await page.locator("#salesQuestionnaireView .upload-box", { hasText: "点击上传血糖报告、截图" }).count();
const glucoseReportUploadRequired = await page.locator("#salesQuestionnaireView .upload-box", { hasText: "点击上传血糖报告、截图" }).locator("strong").count();
const fieldNotesVisible = await page.locator("#salesQuestionnaireView .field-note").count();
const mealTimeFieldsVisible = await page.locator("#salesQuestionnaireView", { hasText: "早餐时间" }).count() + await page.locator("#salesQuestionnaireView", { hasText: "午餐时间" }).count() + await page.locator("#salesQuestionnaireView", { hasText: "晚餐时间" }).count();
const relatedInfoRequiredMarks = await page.locator("#salesQuestionnaireView .sales-section", { hasText: "三、相关信息" }).locator("strong").count();
const fieldNotesLeftOfCard = await page.locator("#salesQuestionnaireView").evaluate(root => {
  const cardLeft = root.querySelector(".sales-questionnaire-card").getBoundingClientRect().left;
  return Array.from(root.querySelectorAll(".field-note")).every(note => note.getBoundingClientRect().right < cardLeft);
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
    "联系电话",
    "用泵人姓名（昵称）",
    "出生日期",
    "性别",
    "身高（cm）",
    "体重（kg）",
    "糖尿病分型 2/24",
    "确诊时间 3/24",
    "当前治疗方案 12/26",
    "每日胰岛素用量和种类（泵）",
    "点击上传基础率分段截图(jpg、png)0/9张",
    "糖尿病并发症 5/24",
    "皮肤相关异常史 6/24",
    "血糖监测方式 8/26",
    "动态血糖仪品牌",
    "平均每月使用次数",
    "指尖血糖检测频率",
    "最近血糖达标率",
    "点击上传血糖报告、截图0/9张",
    "糖化血红蛋白 HbA1c 11/26",
    "检测日期",
    "检测结果(%)",
    "用泵/用AAPS闭环软件主要想改善的问题 20/25",
    "售前备注"
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
await page.locator("#treatmentPlanSelect").selectOption("pump");
const salesNewQuestionSections = await page.locator("#salesQuestionnaireView .sales-section").count();
await page.screenshot({ path: path.join(validationDir, "08-sales-questionnaire.png"), fullPage: true });
await page.getByRole("button", { name: "收案管理" }).click();
const listBrowserTopVisible = await page.locator(".browser-top").evaluate(element => getComputedStyle(element).display !== "none" ? 1 : 0);
const listNotesVisible = await page.locator("#notesPanel:not(.hidden)").count();
const salesNoteHiddenInList = await page.locator('.note-card[data-note="sales-questionnaire"].hidden').count();

const pendingBefore = await page.locator("#pendingCount").innerText();
await page.getByRole("button", { name: "查看" }).click();
await page.getByRole("button", { name: "确认" }).first().click();
const pendingAfterOneConfirm = await page.locator("#pendingCount").innerText();
await page.screenshot({ path: path.join(validationDir, "02-notice-confirmed.png"), fullPage: true });
await page.locator("#closeStationMail").click();

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
await page.getByRole("button", { name: "复制问卷链接" }).click();
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
const stationMailConfirmButtons = await page.locator(".receive-confirm").count();
const autofillDrawerHidden = await page.locator("#autofillDrawer.hidden").count();

await browser.close();

console.log(JSON.stringify({
  ok: consoleErrors.length === 0 && failedRequests.length === 0 && tableRows >= 8 && salesQuestionnaireVisible === 1 && salesNotesVisible === 1 && salesNoteVisible === 1 && salesPatientEditableNoteVisible === 1 && salesHiddenQuestionNoteVisible === 1 && healthcareNotesVisibleInSales === 0 && salesBrowserTopHidden === 1 && salesAppTopbarHidden === 1 && salesAddedTopicsTitleVisible === 1 && salesAddedTopicsCount === 19 && listBrowserTopVisible === 1 && listNotesVisible === 1 && salesNoteHiddenInList === 1 && salesRequiredFields >= 25 && salesSubmitVisible === 1 && logisticsFieldVisible === 0 && userNameFieldVisible === 1 && contactFieldVisible === 1 && pumpUserFieldVisible === 1 && glucoseTargetRateVisible === 1 && glucoseReportUploadVisible === 1 && glucoseReportUploadRequired === 0 && fieldNotesVisible === 2 && mealTimeFieldsVisible === 0 && relatedInfoRequiredMarks === 3 && fieldNotesLeftOfCard === true && salesFieldOrder.ok === true && phoneModelVisibleInitial === 1 && watchModelHiddenInitial === 1 && watchModelVisibleAfterClick === 1 && phoneModelHiddenAfterClick === 1 && complicationDetailVisible === 1 && complicationOptionVisible === 1 && complicationRequiredMarks === 0 && skinDetailVisible === 1 && skinDetailFieldsVisible === 1 && skinDetailRequiredMarks === 0 && pumpPanelVisibleInitial === 1 && penPanelHiddenInitial === 1 && penPanelVisibleAfterSelect === 1 && pumpPanelHiddenAfterSelect === 1 && salesNewQuestionSections === 3 && Number(pendingAfterOneConfirm) === Number(pendingBefore) - 1 && enabledPushButtons === 7 && enabledAutofillButtons === 3 && disabledAutofillButtons === 5 && enabledDeleteButtons === 1 && disabledDeleteButtons === 7 && prepButtons === 6 && processButtons === 2 && disabledProcessButtons === 1 && finishedActionButtons === 0 && receiveActionButtons === tableRows && autofillSalesSectionVisible === 0 && reopenedPrepStep === "创建群聊" && trialUserControlCount === 0 && prevStepButtonCount === 0 && trialPrepStep === "创建看板" && trialVisiblePrepareSteps === 1 && trialGroupBodyVisible === 0 && trialFinishButtonVisible === 1 && processStep === "信息核对" && visiblePrepareStepsInProcess === 0 && processStepperHidden === 1 && prepQuestionnaireLinkVisible === 1 && prepQuestionnaireResultsVisible === 2 && processQuestionnaireLinkVisible === 1 && processQuestionnaireResultsVisible === 2 && autofillDrawerHidden === 1,
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
  listBrowserTopVisible,
  listNotesVisible,
  salesNoteHiddenInList,
  salesRequiredFields,
  salesSubmitVisible,
  logisticsFieldVisible,
  userNameFieldVisible,
  contactFieldVisible,
  pumpUserFieldVisible,
  glucoseTargetRateVisible,
  glucoseReportUploadVisible,
  glucoseReportUploadRequired,
  fieldNotesVisible,
  mealTimeFieldsVisible,
  relatedInfoRequiredMarks,
  fieldNotesLeftOfCard,
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
  salesNewQuestionSections,
  pendingBefore,
  pendingAfterOneConfirm,
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
  stationMailConfirmButtons,
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
    "validation/08-sales-questionnaire.png"
  ]
}, null, 2));
