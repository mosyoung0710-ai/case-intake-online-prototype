const initialCases = [
  { id: 78, name: "11", sex: "女", age: "18岁", height: "11.00", weight: "11.00", type: "T1DM（1型糖尿病）", course: "0月18天", plan: "--", caregiver: "--", contact: "17700000574", orderDate: "2026-08-11", phone: "17700000574", pump: "凯联悦泵", device: "一加", glucoseMonitor: "硅基", channel: "糖糖圈", manager: "JJ", status: "待接收" },
  { id: 75, name: "omt", sex: "女", age: "0月12天", height: "11.00", weight: "11.00", type: "T1DM（1型糖尿病）", course: "0月12天", plan: "生活方式干预（饮食+运动）", caregiver: "哈哈", contact: "17700000583", orderDate: "2026-08-11", phone: "17700000582", pump: "凯联悦泵", device: "中兴", glucoseMonitor: "欧泰", channel: "京东", manager: "JJ", status: "已接收" },
  { id: 68, name: "mmmoos", sex: "女", age: "0月14天", height: "5.00", weight: "1.00", type: "T1DM（1型糖尿病）", course: "0月14天", plan: "降糖药物治疗", caregiver: "美女", contact: "17722699882", orderDate: "2026-08-06", phone: "17700000568", pump: "丹纳RS", device: "小米", glucoseMonitor: "鱼跃", channel: "天猫", manager: "JJ", status: "用户填写中" },
  { id: 67, name: "用户41808", sex: "男", age: "3岁7月", height: "1.00", weight: "50.00", type: "T1DM（1型糖尿病）", course: "12年7月", plan: "餐前+基础（胰岛素笔）", caregiver: "哈哈", contact: "18814136000", orderDate: "2026-08-10", phone: "13800041808", pump: "丹纳RS", device: "荣耀", glucoseMonitor: "三诺", channel: "糖糖圈", manager: "JJ", status: "用户填写中" },
  { id: 63, name: "用户41807", sex: "男", age: "0月26天", height: "185.00", weight: "60.00", type: "T2DM（2型糖尿病）", course: "1月10天", plan: "胰岛素泵", caregiver: "旺旺", contact: "18814136003", orderDate: "2026-08-05", phone: "13800041807", pump: "丹纳RS", device: "荣耀", glucoseMonitor: "德康", channel: "天猫", manager: "JJ", status: "已收案" },
  { id: 52, name: "xionghao", sex: "男", age: "20岁1月", height: "11.00", weight: "22.00", type: "T1DM（1型糖尿病）", course: "1月3天", plan: "胰岛素泵", caregiver: "--", contact: "17700000581", orderDate: "2026-07-01", phone: "17700000581", pump: "丹纳R", device: "中兴", glucoseMonitor: "德康", channel: "京东", manager: "JJ", status: "待接收" },
  { id: 45, name: "试戴用户", sex: "男", age: "7岁", height: "192.00", weight: "91.00", type: "GDM（妊娠糖尿病）", course: "5年4月", plan: "预混（胰岛素笔）", caregiver: "分公司公司", contact: "18814136001", orderDate: "2026-07-23", phone: "13800041805", pump: "凯联悦泵", device: "OPPO手表", glucoseMonitor: "雅培", channel: "糖糖圈", manager: "JJ", status: "用户填写中", isTrial: true },
  { id: 15, name: "测试12", sex: "女", age: "17岁3月", height: "110.00", weight: "100.00", type: "其他特定类型糖尿病", course: "1月4天", plan: "餐前+基础（胰岛素笔）", caregiver: "1111", contact: "13751140843", orderDate: "2026-07-06", phone: "17700000571", pump: "微泰贴泵", device: "一加", glucoseMonitor: "微泰", channel: "京东", manager: "JJ", status: "用户已填写" }
];

let cases = initialCases.map(item => ({ ...item }));
let currentStep = 1;
let currentReceiveCaseId = null;
let receiveMode = "prepare";
let prepProgressById = {};

const rows = document.querySelector("#caseRows");
const reviewShell = document.querySelector(".review-shell");
const browserFrame = document.querySelector("#browserFrame");
const appShell = document.querySelector("#appShell");
const notesPanel = document.querySelector("#notesPanel");
const pendingDot = document.querySelector("#pendingDot");
const tableWrap = document.querySelector(".data-table-wrap");
const caseManagementView = document.querySelector("#caseManagementView");
const salesQuestionnaireView = document.querySelector("#salesQuestionnaireView");
const receiveModal = document.querySelector("#receiveModal");
const receiveHeading = document.querySelector("#receiveHeading");
const autofillDrawer = document.querySelector("#autofillDrawer");
const autofillName = document.querySelector("#autofillName");
const autofillPhone = document.querySelector("#autofillPhone");
const toast = document.querySelector("#toast");

function statusClass(status) {
  if (status === "已收案") return "green";
  if (status === "待接收") return "orange";
  if (status === "用户填写中") return "purple";
  return "";
}

function receiveAction(status) {
  if (["已接收", "用户填写中"].includes(status)) {
    return { enabled: true, label: "收案准备", mode: "prepare" };
  }
  if (status === "用户已填写") {
    return { enabled: true, label: "处理收案", mode: "process" };
  }
  if (status === "已收案") return { enabled: false, label: "处理收案", mode: "process" };
  return { enabled: false, label: "收案准备", mode: "prepare" };
}

function renderRows() {
  rows.innerHTML = cases.map(item => {
    const receiveMeta = receiveAction(item.status);
    const canAutofill = ["已接收", "用户填写中"].includes(item.status);
    const canPush = item.status !== "已收案";
    const canDelete = item.status === "用户已填写";
    const canConfirm = item.status === "待接收";
    return `
      <tr>
        <td><input type="checkbox" /></td>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.sex}</td>
        <td>${item.age}</td>
        <td>${item.height}</td>
        <td>${item.weight}</td>
        <td>${item.type}</td>
        <td>${item.course}</td>
        <td>${item.plan}</td>
        <td>${item.caregiver}</td>
        <td>${item.contact}</td>
        <td>${item.orderDate}</td>
        <td>${item.phone}</td>
        <td>${item.pump}</td>
        <td>${item.device}</td>
        <td>${item.glucoseMonitor}</td>
        <td>${item.channel}</td>
        <td>${item.manager}</td>
        <td><span class="status ${statusClass(item.status)}">${item.status}</span></td>
        <td>
          <div class="row-actions">
            <button data-action="confirm" data-id="${item.id}" ${canConfirm ? "" : "disabled"}>确认</button>
            <button data-action="copy" data-id="${item.id}">复制</button>
            <button data-action="receive" data-id="${item.id}" ${receiveMeta.enabled ? "" : "disabled"}>${receiveMeta.label}</button>
            <button data-action="autofill" data-id="${item.id}" ${canAutofill ? "" : "disabled"}>代填</button>
            <button data-action="push" data-id="${item.id}" ${canPush ? "" : "disabled"}>推送</button>
            <button class="delete" data-action="delete" data-id="${item.id}" ${canDelete ? "" : "disabled"}>删除</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
  updatePendingNotice();
}

function pendingCases() {
  return cases.filter(item => item.status === "待接收");
}

function updatePendingNotice() {
  const count = pendingCases().length;
  pendingDot.classList.toggle("hidden", count === 0);
  pendingDot.textContent = count > 0 ? count : "";
}

function resetTableScroll() {
  if (!tableWrap) return;
  tableWrap.scrollLeft = 0;
}

function showCaseManagement() {
  reviewShell.classList.remove("notes-hidden");
  notesPanel.classList.remove("hidden");
  browserFrame.classList.remove("sales-mode");
  appShell.classList.remove("sales-mode");
  caseManagementView.classList.remove("hidden");
  salesQuestionnaireView.classList.add("hidden");
  window.requestAnimationFrame(resetTableScroll);
}

function showSalesQuestionnaire() {
  reviewShell.classList.remove("notes-hidden");
  notesPanel.classList.remove("hidden");
  browserFrame.classList.add("sales-mode");
  appShell.classList.add("sales-mode");
  caseManagementView.classList.add("hidden");
  salesQuestionnaireView.classList.remove("hidden");
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.remove("hidden");
  window.setTimeout(() => toast.classList.add("hidden"), 1600);
}

function setView(view) {
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  document.querySelectorAll(".note-card").forEach(card => {
    const isSalesNote = card.dataset.note === "sales-questionnaire";
    card.classList.toggle("hidden", view === "sales-questionnaire" ? !isSalesNote : isSalesNote);
    card.classList.toggle("active", card.dataset.note === view);
  });

  if (view === "sales-questionnaire") {
    showSalesQuestionnaire();
  } else {
    showCaseManagement();
  }
  if (view === "receive") {
    const demoCase = cases.find(item => item.status === "用户已填写") || cases[0];
    openReceiveModal(demoCase.id);
  }
}

function openReceiveModal(caseId) {
  const target = cases.find(item => item.id === Number(caseId)) || cases.find(item => item.status === "用户已填写") || cases[0];
  const meta = receiveAction(target.status);
  currentReceiveCaseId = target.id;
  receiveMode = meta.mode;
  document.querySelector("#caseName").textContent = target.name;
  document.querySelector("#summaryName").textContent = target.name;
  document.querySelector("#summaryPhone").textContent = target.phone;
  document.querySelector("#boardName").textContent = `收案准备-${target.name}`;
  document.querySelector("#groupName").value = `收案准备-${target.name}`;
  receiveModal.classList.remove("hidden");
  setStep(receiveMode === "prepare" ? (prepProgressById[target.id] || 2) : 1);
}

function closeReceiveModal() {
  receiveModal.classList.add("hidden");
}

function openAutofillDrawer(caseId) {
  const target = cases.find(item => item.id === Number(caseId)) || cases[0];
  autofillName.value = target.name;
  autofillPhone.value = target.contact;
  autofillDrawer.classList.remove("hidden");
}

function closeAutofillDrawer() {
  autofillDrawer.classList.add("hidden");
}

function setStep(step) {
  currentStep = Number(step);
  const target = cases.find(item => item.id === Number(currentReceiveCaseId));
  const isTrialPrepare = receiveMode === "prepare" && target?.isTrial === true;
  const titles = {
    1: "信息核对",
    2: "创建看板",
    3: "创建群聊"
  };
  const heading = receiveMode === "prepare" ? "收案准备" : "处理收案";
  receiveHeading.textContent = heading;
  document.querySelector("#modalTitle").textContent = `${heading}弹窗 - ${titles[currentStep]}`;
  document.querySelector("#stepName").textContent = titles[currentStep];
  document.querySelector("#stepper").classList.toggle("prepare-mode", receiveMode === "prepare");
  document.querySelector("#stepper").classList.toggle("process-mode", receiveMode === "process");
  document.querySelector("#stepper").classList.toggle("trial-prepare-mode", isTrialPrepare);
  document.querySelector("#stepper").classList.toggle("hidden", receiveMode === "process");
  document.querySelector('.next-step[data-next="3"]').textContent = isTrialPrepare ? "完成准备" : "创建，下一步";
  document.querySelectorAll(".step").forEach(button => {
    const buttonStep = Number(button.dataset.step);
    button.classList.toggle("hidden", button.dataset.mode !== receiveMode || (isTrialPrepare && buttonStep === 3));
    button.classList.toggle("active", buttonStep === currentStep);
    button.classList.toggle("done", buttonStep < currentStep);
  });
  document.querySelectorAll("[data-step-body]").forEach(body => {
    const bodyStep = Number(body.dataset.stepBody);
    const bodyMode = bodyStep === 1 ? "process" : "prepare";
    body.classList.toggle("hidden", bodyMode !== receiveMode || bodyStep !== currentStep || (isTrialPrepare && bodyStep === 3));
  });
}

function confirmReceive(caseId) {
  const target = cases.find(item => item.id === Number(caseId));
  if (target && target.status === "待接收") target.status = "已接收";
  renderRows();
  showToast("已确认接收");
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-toggle-group]").forEach(group => {
  group.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    group.querySelectorAll("button").forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");
    document.querySelectorAll(`[data-toggle-target="${group.dataset.toggleGroup}"]`).forEach(target => {
      const showWhen = target.dataset.showWhen || "has";
      target.classList.toggle("hidden", button.dataset.toggleValue !== showWhen);
    });
  });
});

const treatmentPlanSelect = document.querySelector("#treatmentPlanSelect");
const injectionCountSelect = document.querySelector("#injectionCountSelect");
function syncTreatmentPlan() {
  const selectedPlan = treatmentPlanSelect.value;
  const visiblePlan = selectedPlan === "premix" ? "pen" : selectedPlan;
  document.querySelectorAll("[data-plan-panel]").forEach(panel => {
    panel.classList.toggle("hidden", panel.dataset.planPanel !== visiblePlan);
  });
}
treatmentPlanSelect.addEventListener("change", syncTreatmentPlan);
syncTreatmentPlan();

function syncInjectionRows() {
  const count = Number(injectionCountSelect.value);
  document.querySelectorAll("[data-injection-row]").forEach(row => {
    row.classList.toggle("hidden", Number(row.dataset.injectionRow) > count);
  });
}
injectionCountSelect.addEventListener("change", syncInjectionRows);
syncInjectionRows();

document.querySelector("#openReceiveFromHeader").addEventListener("click", () => {
  const demoCase = cases.find(item => item.status === "用户填写中") || cases[0];
  openReceiveModal(demoCase.id);
});
document.querySelector("#closeReceive").addEventListener("click", closeReceiveModal);
document.querySelector("#closeAutofill").addEventListener("click", closeAutofillDrawer);
document.querySelector("#nextAutofillPage").addEventListener("click", () => showToast("已切到下一页问卷"));

document.querySelectorAll(".step").forEach(button => {
  button.addEventListener("click", () => setStep(button.dataset.step));
});
document.querySelectorAll(".next-step").forEach(button => {
  button.addEventListener("click", () => {
    const target = cases.find(item => item.id === Number(currentReceiveCaseId));
    if (receiveMode === "prepare" && target?.isTrial) {
      prepProgressById[currentReceiveCaseId] = 2;
      closeReceiveModal();
      showToast("已完成收案准备");
      return;
    }
    if (receiveMode === "prepare" && currentReceiveCaseId) {
      prepProgressById[currentReceiveCaseId] = Math.max(prepProgressById[currentReceiveCaseId] || 2, Number(button.dataset.next));
    }
    setStep(button.dataset.next);
  });
});
document.querySelector("#finishReceive").addEventListener("click", () => {
  const target = cases.find(item => item.id === Number(currentReceiveCaseId)) || cases.find(item => item.status === "用户已填写") || cases[0];
  target.status = "已收案";
  renderRows();
  closeReceiveModal();
  showToast("已完成收案");
});

document.querySelector("#finishPrep").addEventListener("click", () => {
  if (currentReceiveCaseId) prepProgressById[currentReceiveCaseId] = 3;
  closeReceiveModal();
  showToast("已完成收案准备");
});

const copyQuestionnaireLink = document.querySelector("#copyQuestionnaireLink");
if (copyQuestionnaireLink) {
  copyQuestionnaireLink.addEventListener("click", () => {
    showToast("已复制问卷链接");
  });
}

document.querySelector("#resetDemo").addEventListener("click", () => {
  cases = initialCases.map(item => ({ ...item }));
  prepProgressById = {};
  showCaseManagement();
  closeReceiveModal();
  closeAutofillDrawer();
  renderRows();
  setView("list");
  showToast("已重置演示状态");
});

rows.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "receive") openReceiveModal(button.dataset.id);
  if (button.dataset.action === "copy") showToast("已复制问卷链接");
  if (button.dataset.action === "confirm") confirmReceive(button.dataset.id);
  if (button.dataset.action === "autofill") openAutofillDrawer(button.dataset.id);
  if (button.dataset.action === "push") showToast("组内推送功能本次不改，发问卷入口已放入收案弹窗");
});

receiveModal.addEventListener("click", event => {
  if (event.target === receiveModal) closeReceiveModal();
});
autofillDrawer.addEventListener("click", event => {
  if (event.target === autofillDrawer) closeAutofillDrawer();
});
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("pageshow", () => window.requestAnimationFrame(resetTableScroll));

renderRows();
setView("list");
