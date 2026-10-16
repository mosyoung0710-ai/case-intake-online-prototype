const registrationChannels = [
  ["私域电商", ["内部电商-糖糖圈", "老带新"]],
  ["传统电商", ["传统电商-京东", "传统电商-天猫", "传统电商-拼多多"]],
  ["兴趣电商", ["兴趣电商-抖音", "兴趣电商-小红书"]],
  ["B端渠道", ["外部合作-城市合伙人", "线下院端", "渠道合作", "国控平台", "合作（国控）"]]
];
const channelOptions = ["内部电商-糖糖圈", "传统电商-京东", "传统电商-天猫", "传统电商-拼多多", "兴趣电商-抖音", "兴趣电商-小红书", "外部合作-城市合伙人", "线下院端", "渠道合作", "国控平台", "合作（国控）", "老带新"];
function registrationChannelLabel(user) {
  if (!user.proxyRegistered) return "无";
  return registrationChannels.find(([, options]) => options.includes(user.channel))?.[0] || "无";
}

const registrationForm = document.querySelector("#proxyRegistrationForm");
const registrationChoices = {
  identity: ["患者", "亲属", "孕妇", "专业人士"],
  sex: ["男", "女"],
  diabetesType: ["1型糖尿病", "2型糖尿病", "妊娠糖尿病", "其他类型"],
  treatment: ["胰岛素泵", "餐前+基础", "预混胰岛素", "降糖药物治疗", "饮食运动教育", "周制剂", "混合闭环胰岛素输注系统AAPS", "混合闭环胰岛素输注系统LOOP"],
  gift: ["控糖小白，想学习更多控糖知识", "已经学会如何控糖，想了解前沿信息"]
};
Object.entries(registrationChoices).forEach(([name, options]) => {
  const group = document.querySelector(`[data-registration-options="${name}"]`);
  options.forEach(value => {
    const label = document.createElement("label");
    label.className = "registration-choice";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.required = true;
    const text = document.createElement("span");
    text.textContent = value;
    label.append(input, text);
    group.append(label);
  });
});
channelOptions.forEach(value => registrationForm.elements.channel.add(new Option(value, value)));

let avatarUrl = null;
document.querySelector("#registrationAvatarInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  if (avatarUrl) URL.revokeObjectURL(avatarUrl);
  avatarUrl = URL.createObjectURL(file);
  const image = document.querySelector("#registrationAvatar");
  image.src = avatarUrl;
  image.classList.remove("hidden");
});

const salesPermission = document.querySelector("#demoSalesPermission");
const registrationPermission = document.querySelector("#demoRegistrationPermission");
function syncRegistrationPermissions() {
  document.querySelector('[data-permission-entry="sales"]').classList.toggle("hidden", !salesPermission.checked);
  document.querySelector('[data-permission-entry="registration"]').classList.toggle("hidden", !registrationPermission.checked);
}
salesPermission.addEventListener("change", syncRegistrationPermissions);
registrationPermission.addEventListener("change", syncRegistrationPermissions);

const crmColumns = [
  ["id", "ID", 70], ["nickname", "昵称", 100], ["phone", "电话", 120], ["channelLabel", "用户渠道", 105],
  ["identity", "身份", 80], ["account", "账号身份", 90], ["plan", "方案", 100], ["sex", "性别", 55],
  ["age", "年龄(岁)", 70], ["course", "糖龄", 65], ["glucose", "血糖个数", 80], ["hospital", "项目医院", 90],
  ["partner", "项目合作医院", 100], ["region", "地区", 80], ["member", "会员状态", 80],
  ["registeredAt", "注册时间", 110], ["visitedAt", "访问时间", 110], ["courseGift", "领取课程", 90],
  ["nextVisit", "下次随访时间", 110], ["followStatus", "跟进状态", 80], ["intentionType", "意向类型", 80],
  ["intention", "意向程度", 80], ["deal", "交易状态", 80], ["manager", "跟进人", 90],
  ["progress", "收案进度", 100], ["actions", "操作", 65]
];
const sampleNames = ["林小糖", "陈晨", "周女士", "李先生", "王小雨", "赵女士", "郑晨", "许宁", "钱女士", "孙先生", "杨糖", "刘先生", "吴女士", "何小满", "顾先生", "陆女士"];
const initialCrmUsers = sampleNames.map((nickname, index) => ({
  id: 65530 - index, nickname, phone: `138****${String(9200 + index)}`, identity: index === 4 ? "亲属" : "患者",
  account: "一型糖友", plan: ["胰岛素泵", "餐前+基础", "运动降糖", "降糖药物治疗"][index % 4],
  sex: index % 2 ? "男" : "女", age: [34, 28, 43, 51, 8, 32][index % 6], course: "5年",
  glucose: "--", hospital: "无", partner: "否", region: ["深圳", "济南", "上海"][index % 3], member: "--",
  registeredAt: "2026-10-15", visitedAt: "2026-10-15", courseGift: index % 3 ? "未领取" : "已领取",
  nextVisit: "--", followStatus: "--", intentionType: "--", intention: "--", deal: "--",
  manager: ["陈经理", "李经理", "--"][index % 3], progress: ["--", "待接收", "用户已填写", "已收案"][index % 4],
  birthday: "1992-03-08", diagnosis: "2021-06-01",
  // Only proxy registration is eligible for a channel label, even if another account has a channel value.
  proxyRegistered: index < 13 && index % 5 !== 4, channel: channelOptions[index % 12]
}));
let crmUsers = initialCrmUsers.map(user => ({ ...user }));
let filteredCrmUsers = [...crmUsers];
let crmPage = 1;
const crmPageSize = 10;
const crmForm = document.querySelector("#crmSearchForm");
const crmIntention = crmForm.querySelectorAll('.crm-filter-row select')[1];
crmIntention.name = "intention";
crmIntention.options[0].value = "";
crmForm.querySelectorAll('input[type="date"]').forEach((input,index) => {
  input.name = ["birthdayFrom","birthdayTo","diagnosisFrom","diagnosisTo","registeredAtFrom","registeredAtTo"][index];
});
const crmTableRows = document.querySelector("#crmCustomerRows");
const crmHeadRow = document.createElement("tr");
crmColumns.forEach(([key,name,width]) => {
  const th = document.createElement("th");
  th.textContent = name;
  if (key === "channelLabel") {
    const marker = document.createElement("span");
    marker.className = "registration-note-number crm-channel-note-number";
    marker.textContent = "1";
    marker.setAttribute("aria-label", "修改点1");
    th.append(marker);
  }
  th.style.width = `${width}px`;
  crmHeadRow.append(th);
});
document.querySelector("#crmCustomerHead").append(crmHeadRow);

function renderCrmUsers() {
  crmTableRows.replaceChildren();
  const totalPages = Math.max(1, Math.ceil(filteredCrmUsers.length / crmPageSize));
  crmPage = Math.max(1, Math.min(crmPage, totalPages));
  filteredCrmUsers.slice((crmPage - 1) * crmPageSize, crmPage * crmPageSize).forEach(user => {
    const tr = document.createElement("tr");
    tr.dataset.userId = user.id;
    crmColumns.forEach(([key]) => {
      const td = document.createElement("td");
      if (key === "channelLabel") {
        const label = registrationChannelLabel(user);
        td.textContent = label;
        td.className = label === "无" ? "crm-channel-none" : "crm-channel";
      } else if (key === "actions") {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "查看";
        button.addEventListener("click", () => openCrmDetails(user));
        td.append(button);
      } else td.textContent = user[key] ?? "--";
      tr.append(td);
    });
    crmTableRows.append(tr);
  });
  if (!filteredCrmUsers.length) {
    const row = crmTableRows.insertRow();
    row.className = "crm-empty";
    const cell = row.insertCell();
    cell.colSpan = crmColumns.length;
    cell.textContent = "暂无数据";
  }
  document.querySelector("#crmTotal").textContent = crmUsers.length;
  const pages = document.querySelector("#crmPages");
  pages.replaceChildren();
  for (let number = 1; number <= totalPages; number++) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = number;
    button.classList.toggle("active", number === crmPage);
    button.addEventListener("click", () => { crmPage = number; renderCrmUsers(); });
    pages.append(button);
  }
  document.querySelector("#crmPageInput").value = crmPage;
  document.querySelector("#crmPageInput").max = totalPages;
  document.querySelector("#crmPrevious").disabled = crmPage === 1;
  document.querySelector("#crmNext").disabled = crmPage === totalPages;
}
function queryCrmUsers() {
  const data = new FormData(crmForm);
  const keyword = String(data.get("keyword")).trim().toLowerCase();
  const searchField = { "昵称": "nickname", "ID": "id", "电话": "phone" }[data.get("searchType")];
  filteredCrmUsers = crmUsers.filter(user => {
    if (keyword && !String(user[searchField]).toLowerCase().includes(keyword)) return false;
    if (data.get("plan") && user.plan !== data.get("plan")) return false;
    if (data.get("identity") && user.identity !== data.get("identity")) return false;
    if (data.get("manager") && !user.manager.includes(data.get("manager"))) return false;
    if (data.get("progress") && user.progress !== data.get("progress")) return false;
    if (data.get("channelGroup") && registrationChannelLabel(user) !== data.get("channelGroup")) return false;
    if (data.get("intention") && user.intention !== data.get("intention")) return false;
    for (const field of ["birthday", "diagnosis", "registeredAt"]) {
      const from = data.get(`${field}From`);
      const to = data.get(`${field}To`);
      if ((from || to) && !user[field]) return false;
      if (from && user[field] < from) return false;
      if (to && user[field] > to) return false;
    }
    return true;
  });
  crmPage = 1;
  renderCrmUsers();
}
crmForm.addEventListener("submit", event => { event.preventDefault(); queryCrmUsers(); });
document.querySelector("#crmPrevious").addEventListener("click", () => { crmPage--; renderCrmUsers(); });
document.querySelector("#crmNext").addEventListener("click", () => { crmPage++; renderCrmUsers(); });
document.querySelector("#crmPageInput").addEventListener("change", event => { crmPage = Number(event.target.value) || 1; renderCrmUsers(); });

function openCrmDetails(user) {
  document.querySelector("#crmDialogTitle").textContent = user.nickname;
  const list = document.createElement("dl");
  [["ID", user.id], ["手机号", user.phone], ["身份", user.identity], ["用户渠道", registrationChannelLabel(user)], ["方案", user.plan], ["性别", user.sex]].forEach(([label,value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    list.append(dt,dd);
  });
  document.querySelector("#crmDialogBody").replaceChildren(list);
  document.querySelector("#crmExistingDialog").showModal();
}
document.querySelector("#crmDialogClose").addEventListener("click", () => document.querySelector("#crmExistingDialog").close());
document.querySelectorAll("[data-crm-existing]").forEach(button => button.addEventListener("click", () => showToast(button.dataset.crmExisting)));

let registrationSubmitted = false;
registrationForm.addEventListener("input", () => { registrationSubmitted = false; });
registrationForm.addEventListener("submit", event => {
  event.preventDefault();
  if (registrationSubmitted) return;
  if (!registrationForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(registrationForm));
  const birthday = new Date(`${values.birthday}T00:00:00`);
  const today = new Date();
  const birthdayPassed = today.getMonth() > birthday.getMonth() || (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());
  const age = today.getFullYear() - birthday.getFullYear() - (birthdayPassed ? 0 : 1);
  const user = {
    ...values,
    id: Math.max(...crmUsers.map(item => item.id)) + 1, nickname: values.nickname, phone: values.phone,
    identity: values.identity, sex: values.sex, age, plan: values.treatment, channel: values.channel,
    proxyRegistered: true, registeredAt: new Date().toLocaleDateString("sv-SE"), progress: "--", manager: "--"
  };
  crmUsers.unshift(user);
  registrationSubmitted = true;
  const card = document.querySelector(".sales-user-card").cloneNode(true);
  card.dataset.proxyUser = user.id;
  card.classList.remove("active");
  card.querySelector("strong").textContent = `${user.nickname} (${user.id})`;
  card.querySelector("p").textContent = `${user.sex}｜${user.age}岁｜收案进度：--`;
  card.querySelector("small").textContent = `手机号：${user.phone}`;
  card.querySelector('[data-view-jump]').addEventListener("click", () => setView("sales-questionnaire"));
  card.querySelector('[data-open-sales-page]').addEventListener("click", () => {
    openSalesAppPage("case-list");
    document.querySelector("#salesAppView").classList.add("proxy-user-empty");
    let empty = document.querySelector("#proxyEmptyCases");
    if (!empty) {
      empty = document.createElement("p");
      empty.id = "proxyEmptyCases";
      empty.textContent = "暂无收案记录";
      document.querySelector('[data-sales-app-page="case-list"] [data-app-case-record]').before(empty);
    }
    empty.classList.remove("hidden");
  });
  document.querySelector(".sales-user-list").prepend(card);
  queryCrmUsers();
  showToast("创建成功");
});
document.querySelector("#resetDemo").addEventListener("click", () => {
  crmUsers = initialCrmUsers.map(user => ({ ...user }));
  crmForm.reset();
  queryCrmUsers();
  registrationForm.reset();
  document.querySelector(".registration-scroll").scrollTop = 0;
  document.querySelector(".home-entry-scroll").scrollTop = 0;
  registrationSubmitted = false;
  document.querySelectorAll("[data-proxy-user]").forEach(card => card.remove());
  document.querySelector("#registrationAvatar").classList.add("hidden");
  if (avatarUrl) URL.revokeObjectURL(avatarUrl);
  avatarUrl = null;
  salesPermission.checked = true;
  registrationPermission.checked = true;
  syncRegistrationPermissions();
});
syncRegistrationPermissions();
renderCrmUsers();
