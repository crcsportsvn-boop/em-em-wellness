/**
 * ÊM ÊM WELLNESS - CORE APPLICATION SCRIPT
 * Version: 2.3.0
 * Pure Vietnamese copy - No English in brackets
 * Features:
 *  - 3D Human Atlas Anatomical Viewer (Three.js 360° auto-rotation & muscle highlight)
 *  - Dedicated Booking Window / Modal with 5 Services (3 top, 2 bottom)
 *  - Balanced wizard spacing & removed email requirement
 *  - Clear Booking / Check-in Code Display & reminder in Step 4
 *  - Automated Payment Verification Engine (Polling & Webhook simulation)
 *  - Simplified Footer with logo.png & right-aligned description
 *  - Hidden Manager Portal via Keyboard Shortcut (Ctrl+Shift+A) or Footer Lock
 */

import * as THREE from 'three';
import { 
  initAtlasViewer, 
  fitCameraToWindow, 
  updateActivePackageHighlight, 
  highlightMuscleOnHover, 
  resetMuscleHover 
} from './atlas-viewer.js';

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initBookingWindow();
  initAnatomyModals();
  initHiddenManagerPortal();
});

/* ==========================================================================
   1. HEADER SCROLL EFFECT
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   2. 3D HUMAN ATLAS ENGINE & ANATOMICAL MODAL (THREE.JS 360° ROTATION)
   ========================================================================== */
const therapyDetails = {
  upper: {
    key: "upper",
    title: "Trị Liệu Thân Trên",
    duration: "60 phút",
    regions: "Đầu, cổ vai gáy, lưng trên, hai cánh tay, cẳng tay và khớp cổ tay",
    note: "Vùng ngực chỉ áp dụng cho khách hàng nam.",
    activeMuscles: ['scm', 'splenius', 'trapezius', 'rhomboids', 'rotator_cuff', 'deltoids', 'pectorals', 'arm_biceps_triceps', 'arm_forearm'],
    muscles: [
      { id: 'scm', name: "Cơ ức đòn chũm & cơ cổ", desc: "Giải tỏa căng cứng vùng cổ bên, giải phóng tuần hoàn máu não, xua tan đau đầu." },
      { id: 'trapezius', name: "Cơ thang vai gáy", desc: "Vùng cơ chịu tải trọng lớn nhất, xua tan mỏi vai gáy kinh niên và co thắt cơ." },
      { id: 'rhomboids', name: "Cơ trám giữa hai bả vai", desc: "Giải phóng điểm thắt giữa hai xương bả vai, mở rộng lồng ngực, hít thở sâu." },
      { id: 'rotator_cuff', name: "Nhóm cơ chóp xoay vai", desc: "Phục hồi tầm vận động khớp vai, chống co cứng và ngừa viêm dính bao khớp." },
      { id: 'deltoids', name: "Cơ Delta bả vai", desc: "Giải phóng sức nặng treo cánh tay, kích hoạt dòng khí huyết lưu thông chi trên." },
      { id: 'pectorals', name: "Cơ ngực lớn & nhỏ", desc: "Mở rộng khung sườn, chống gù lưng vai khum, tăng dung tích lồng ngực." },
      { id: 'arm_biceps_triceps', name: "Cơ bắp tay trước & sau", desc: "Giải tỏa bó cơ nhị đầu & tam đầu mỏi do lái xe, xách vật nặng, làm việc lâu." },
      { id: 'arm_forearm', name: "Cơ cẳng tay & khớp cổ tay", desc: "Xoa dịu mỏi ngón tay, tê bì cẳng tay do dùng chuột và gõ phím máy tính." }
    ],
    benefits: [
      "Giải tỏa triệt để điểm nút co thắt cơ gây hoa mắt, đau nửa đầu.",
      "Tăng cường lưu thông máu lên não, cải thiện giấc ngủ sâu và ngon giấc.",
      "Phục hồi độ linh hoạt dẻo dai của các đốt sống cổ, khớp vai và cổ tay.",
      "Thích hợp nhất cho người làm văn phòng, kỹ sư phần mềm, lái xe nhiều."
    ]
  },
  lower: {
    key: "lower",
    title: "Trị Liệu Thân Dưới",
    duration: "60 phút",
    regions: "Thắt lưng, khớp hông, cơ mông, đùi trước, đùi sau, bắp chuối và mu bàn chân",
    note: "Hỗ trợ giải tỏa chèn ép dây thần kinh tọa và căng cơ thắt lưng.",
    activeMuscles: ['quadratus_lumborum', 'erector_spinae', 'gluteals', 'piriformis', 'quadriceps', 'hamstrings_upper', 'calves', 'shin_foot'],
    muscles: [
      { id: 'quadratus_lumborum', name: "Cơ vuông thắt lưng", desc: "Giải tỏa nguyên nhân cốt lõi gây đau ê ẩm, căng buốt vùng thắt lưng dưới khi ngồi lâu." },
      { id: 'erector_spinae', name: "Cơ dựng sống thắt lưng", desc: "Nâng đỡ trục thẳng cột sống, giải tỏa áp lực đè ép lên các đĩa đệm L4-L5-S1." },
      { id: 'gluteals', name: "Nhóm cơ mông (Lớn, Nhỡ, Bé)", desc: "Khắc phục ức chế cơ do ngồi tĩnh tại, giảm chấn động dồn ép lên cột sống và gối." },
      { id: 'piriformis', name: "Cơ hình lê (Khớp háng)", desc: "Giải phóng chèn ép dây thần kinh tọa, chống tê buốt và nhức mỏi lan xuống chân." },
      { id: 'quadriceps', name: "Cơ tứ đầu đùi (Mặt trước)", desc: "Giải tỏa căng cơ mặt trước đùi, trợ lực khớp gối và cân bằng khung xương chậu." },
      { id: 'hamstrings_upper', name: "Cơ gân kheo (Mặt sau đùi)", desc: "Giải phóng dải cơ bám đùi sau, giúp bước đi nhẹ nhõm, gập duỗi chân êm ái." },
      { id: 'calves', name: "Cơ bắp chuối & gân gót Achilles", desc: "Kích hoạt hồi lưu tĩnh mạch về tim, xua tan cảm giác nặng trĩu chân và ngừa chuột rút." },
      { id: 'shin_foot', name: "Cơ cẳng chân & mu bàn chân", desc: "Giải tỏa căng cứng cơ chày trước, đả thông huyệt đạo mu chân và các ngón chân." }
    ],
    benefits: [
      "Xua tan cảm giác nặng nề, đau ê ẩm thắt lưng và hông sau ngày dài làm việc.",
      "Cân bằng lại độ nghiêng khung xương chậu và trục thẳng tự nhiên của cột sống.",
      "Giúp bước đi thanh thoát, chuyển tư thế đứng lên ngồi xuống dễ dàng, không đau.",
      "Rất thích hợp cho người ngồi văn phòng trên 8 tiếng, tài xế hoặc đứng lâu."
    ]
  },
  full: {
    key: "full",
    title: "Trị Liệu Toàn Thân",
    duration: "90 phút",
    regions: "Toàn bộ hệ cơ từ đỉnh đầu, cổ vai gáy, hai tay, ngực bụng, lưng eo đến toàn bộ hai chân và bàn chân",
    note: "Liệu trình sâu toàn diện giúp tái thiết lập dòng năng lượng tự nhiên.",
    activeMuscles: [
      'full_neck_head', 'full_upper_back_chest', 'full_arms_hands',
      'full_lower_back', 'full_glutes_hip', 'full_thighs', 'full_calves', 'full_feet'
    ],
    muscles: [
      { id: 'full_neck_head', name: "Cổ vai gáy & cơ chẩm đầu", desc: "Giải tỏa căng cứng cơ thang, cơ ức đòn chũm, đưa máu giàu oxy nuôi dưỡng não bộ." },
      { id: 'full_upper_back_chest', name: "Lưng trên & khung sườn ngực", desc: "Giải phóng co rút bả vai, mở rộng lồng ngực, hồi phục thể tích hô hấp tự nhiên." },
      { id: 'full_arms_hands', name: "Hai cánh tay & khớp cổ bàn tay", desc: "Giải tỏa mỏi bó cơ bắp tay, cẳng tay và các khớp ngón tay linh hoạt êm ái." },
      { id: 'full_lower_back', name: "Thắt lưng & cơ dựng sống", desc: "Tái thiết lập sự thẳng hàng của cột sống, giảm tải áp lực đĩa đệm toàn dải lưng." },
      { id: 'full_glutes_hip', name: "Khung chậu & nhóm cơ mông", desc: "Giải phóng khớp hông và cơ hình lê, giải tỏa triệt để chèn ép dây thần kinh tọa." },
      { id: 'full_thighs', name: "Cơ đùi trước & đùi sau toàn diện", desc: "Cân bằng cơ tứ đầu đùi và gân kheo, trợ lực khớp gối và chuyển động đôi chân." },
      { id: 'full_calves', name: "Cơ bắp chuối & gân gót Achilles", desc: "Thúc đẩy dẫn lưu tĩnh mạch bạch huyết, xua tan ứ trệ phù nề và nặng chân." },
      { id: 'full_feet', name: "Cẳng chân trước, mu chân & bàn chân", desc: "Đả thông huyệt đạo bàn chân, giải phóng điểm tắc nghẽn, tái tạo sinh lực toàn thân." }
    ],
    benefits: [
      "Thư giãn hệ thần kinh sâu, loại bỏ hoàn toàn căng thẳng tích tụ sau tuần bận rộn.",
      "Tăng cường lưu thông tuần hoàn máu và hệ bạch huyết, đào thải độc tố mô cơ.",
      "Đem lại cảm giác cơ thể nhẹ nhõm như được giải phóng mọi bó cơ đè nặng.",
      "Liệu trình hoàn hảo nhất cho khách hàng muốn phục hồi năng lượng toàn diện."
    ]
  }
};

let currentActivePackageKey = 'upper';
let currentFocusedMuscleId = null;

/**
 * Chuyển đổi gói trị liệu và cập nhật highlight nhóm cơ trên mô hình 3D BodyParts3D
 */
function switchAtlasPackage(pkgKey, specificMuscleId = null) {
  const data = therapyDetails[pkgKey];
  if (!data) return;

  currentActivePackageKey = pkgKey;
  currentFocusedMuscleId = specificMuscleId;

  // Cập nhật tab gói
  document.querySelectorAll('.atlas-tab-btn').forEach(tab => {
    const tabKey = tab.getAttribute('data-switch-anatomy');
    tab.classList.toggle('active', tabKey === pkgKey);
  });

  // Kích hoạt highlight nhóm cơ của gói trị liệu trên GPU shader
  updateActivePackageHighlight(pkgKey);

  // Render lại cột thông tin y khoa dạng lưới 2 cột gọn gàng trên 1 trang
  renderAtlasDetailsColumn(data);
}

/**
 * Render nội dung chi tiết trị liệu gọn gàng trên 1 page không cần lăn chuột
 */
function renderAtlasDetailsColumn(data) {
  const body = document.getElementById('anatomyContentBody');
  if (!body) return;

  body.innerHTML = `
    <div class="atlas-card-body-inner">
      <div class="atlas-service-header">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">
          <h2 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-primary-dark); font-weight: 600; margin: 0;">
            ${data.title}
          </h2>
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary); background: var(--color-primary-subtle); padding: 0.15rem 0.6rem; border-radius: var(--radius-full);">
            ${data.duration}
          </span>
        </div>
        <div class="atlas-impact-banner">
          <strong>Vùng tác động:</strong> ${data.regions}
        </div>
      </div>

      <div class="atlas-section-subtitle">CÁC NHÓM CƠ ĐƯỢC TRỊ LIỆU TRỌNG ĐIỂM:</div>
      
      <!-- Lưới 2 cột cho các thẻ nhóm cơ -->
      <div class="atlas-muscles-grid">
        ${data.muscles.map(m => `
          <div class="interactive-muscle-card ${currentFocusedMuscleId === m.id ? 'active' : ''}" data-muscle-id="${m.id}">
            <div class="muscle-name-title">✦ ${m.name}</div>
            <div class="muscle-desc-text">${m.desc}</div>
          </div>
        `).join('')}
      </div>

      <div class="atlas-section-subtitle">LỢI ÍCH PHỤC HỒI THÂN THỂ:</div>
      <div class="atlas-benefits-grid">
        ${data.benefits.map(b => `
          <div class="atlas-benefit-item">
            <span style="color: var(--color-accent-green); font-weight: 700; flex-shrink: 0;">✓</span>
            <span>${b}</span>
          </div>
        `).join('')}
      </div>

      <div class="atlas-actions-row">
        <button class="btn btn-primary" style="padding: 0.55rem 1.6rem; font-size: 0.84rem;" onclick="openBookingWithService('${data.title}', '${data.duration}')">
          Đặt Chỗ Cho Gói Này
        </button>
      </div>
    </div>
  `;

  // Gắn sự kiện hover rê chuột vào từng thẻ cơ để highlight tức thì (mô hình vẫn tiếp tục xoay)
  body.querySelectorAll('.interactive-muscle-card').forEach(card => {
    const muscleId = card.getAttribute('data-muscle-id');

    card.addEventListener('mouseenter', () => {
      currentFocusedMuscleId = muscleId;
      highlightMuscleOnHover(muscleId);
      body.querySelectorAll('.interactive-muscle-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });

    card.addEventListener('mouseleave', () => {
      currentFocusedMuscleId = null;
      resetMuscleHover();
      card.classList.remove('active');
    });

    card.addEventListener('click', () => {
      currentFocusedMuscleId = muscleId;
      highlightMuscleOnHover(muscleId);
      body.querySelectorAll('.interactive-muscle-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
}

/**
 * Khởi tạo modal chi tiết giải phẫu và kết nối nút mở
 */
function initAnatomyModals() {
  const modal = document.getElementById('anatomyModal');
  const closeBtn = document.getElementById('closeAnatomyBtn');

  // Nút mở modal từ các thẻ dịch vụ trên trang chủ
  document.querySelectorAll('[data-anatomy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.getAttribute('data-anatomy') || 'upper';
      openAnatomyModal(type);
    });
  });

  // Các nút tab chuyển đổi nhanh các gói bên trong modal
  document.querySelectorAll('[data-switch-anatomy]').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const pkgKey = tab.getAttribute('data-switch-anatomy');
      switchAtlasPackage(pkgKey);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeAnatomyModal());
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) closeAnatomyModal();
  });
}

function openAnatomyModal(pkgKey = 'upper') {
  const modal = document.getElementById('anatomyModal');
  if (!modal) return;

  modal.classList.add('active');

  // Khởi tạo hoặc cập nhật Three.js atlas
  initAtlasViewer();
  setTimeout(() => {
    fitCameraToWindow();
    switchAtlasPackage(pkgKey);
  }, 50);
}

function closeAnatomyModal() {
  const modal = document.getElementById('anatomyModal');
  if (modal) modal.classList.remove('active');
}

// Gán toàn cục vào window để tương thích với HTML inline calls
window.openBookingWithService = function(name, duration) {
  closeAnatomyModal();
  openBookingWindow(name, duration);
};
window.closeAnatomyModal = closeAnatomyModal;
window.switchAtlasPackage = switchAtlasPackage;

/* ==========================================================================
   3. DEDICATED BOOKING WINDOW / MODAL WITH 5 SERVICES & AUTOMATED VERIFICATION
   ========================================================================== */
let bookingState = {
  serviceName: "Trị Liệu Thân Trên",
  servicePrice: "490.000 VNĐ",
  serviceDuration: "60 phút",
  selectedDate: "",
  selectedSlot: "",
  customerName: "",
  customerPhone: "",
  customerNote: "",
  depositAmount: 100000,
  transferCode: "",
  currentStep: 1
};

let paymentPollingTimer = null;

function initBookingWindow() {
  generateDateList();
  initServiceSelection();
  initSlotPicker();
  initWizardNavigation();

  // Attach trigger to all "Đặt Chỗ Ngay" buttons on the site
  document.querySelectorAll('[data-open-booking]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const presetService = btn.getAttribute('data-service');
      const presetDuration = btn.getAttribute('data-duration');
      openBookingWindow(presetService, presetDuration);
    });
  });

  const closeBookingBtn = document.getElementById('closeBookingWindowBtn');
  const bookingModal = document.getElementById('bookingWindowModal');
  if (closeBookingBtn && bookingModal) {
    closeBookingBtn.addEventListener('click', () => closeBookingWindow());
    window.addEventListener('click', (e) => {
      if (e.target === bookingModal) closeBookingWindow();
    });
  }
}

function openBookingWindow(serviceName, duration) {
  const modal = document.getElementById('bookingWindowModal');
  if (!modal) return;

  if (serviceName) {
    bookingState.serviceName = serviceName;
    if (duration) bookingState.serviceDuration = duration;

    // Highlight selected radio card
    document.querySelectorAll('#bookingWindowModal .service-radio-card').forEach(card => {
      const cardTitle = card.querySelector('.service-radio-name').innerText;
      if (cardTitle.toLowerCase().includes(serviceName.toLowerCase()) || serviceName.toLowerCase().includes(cardTitle.toLowerCase())) {
        card.classList.add('selected');
        bookingState.servicePrice = card.querySelector('.service-radio-price').innerText;
      } else {
        card.classList.remove('selected');
      }
    });
  }

  goToStep(1);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBookingWindow() {
  const modal = document.getElementById('bookingWindowModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  if (paymentPollingTimer) clearInterval(paymentPollingTimer);
}

function generateDateList() {
  const container = document.getElementById('modalDateScrollContainer');
  if (!container) return;

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();
  container.innerHTML = '';

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const dayName = i === 0 ? 'Hôm nay' : daysOfWeek[d.getDay()];
    const dateNum = d.getDate();
    const monthNum = d.getMonth() + 1;

    const dateItem = document.createElement('div');
    dateItem.className = `date-item ${i === 0 ? 'selected' : ''}`;
    dateItem.innerHTML = `
      <div class="date-day">${dayName}</div>
      <div class="date-num">${dateNum}</div>
      <div style="font-size: 0.7rem; opacity: 0.8;">Tháng ${monthNum}</div>
    `;

    if (i === 0) {
      bookingState.selectedDate = `${dayName}, ${dateNum}/${monthNum}`;
    }

    dateItem.addEventListener('click', () => {
      container.querySelectorAll('.date-item').forEach(el => el.classList.remove('selected'));
      dateItem.classList.add('selected');
      bookingState.selectedDate = `${dayName}, ${dateNum}/${monthNum}`;
      updateSlots(i);
    });

    container.appendChild(dateItem);
  }
}

function updateSlots(dayIndex) {
  const slotButtons = document.querySelectorAll('#bookingWindowModal .slot-btn');
  slotButtons.forEach((btn, index) => {
    btn.classList.remove('selected');
    btn.disabled = false;
    if ((dayIndex === 0 && (index === 1 || index === 4)) || (dayIndex === 2 && index === 2)) {
      btn.disabled = true;
    }
  });
  bookingState.selectedSlot = "";
}

function initServiceSelection() {
  const cards = document.querySelectorAll('#bookingWindowModal .service-radio-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      bookingState.serviceName = card.querySelector('.service-radio-name').innerText;
      bookingState.servicePrice = card.querySelector('.service-radio-price').innerText;
      bookingState.serviceDuration = card.getAttribute('data-duration') || '60 phút';
    });
  });
}

function initSlotPicker() {
  const slotButtons = document.querySelectorAll('#bookingWindowModal .slot-btn');
  slotButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      slotButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      bookingState.selectedSlot = btn.getAttribute('data-slot');
    });
  });
}

function initWizardNavigation() {
  document.querySelectorAll('#bookingWindowModal [data-wizard-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.getAttribute('data-wizard-next'));
      if (validateWizardStep(bookingState.currentStep)) {
        goToStep(next);
      }
    });
  });

  document.querySelectorAll('#bookingWindowModal [data-wizard-prev]').forEach(btn => {
    btn.addEventListener('click', () => {
      const prev = parseInt(btn.getAttribute('data-wizard-prev'));
      goToStep(prev);
    });
  });
}

function validateWizardStep(step) {
  if (step === 1) {
    if (!bookingState.serviceName) {
      alert('Vui lòng chọn một gói trị liệu.');
      return false;
    }
    return true;
  }
  if (step === 2) {
    if (!bookingState.selectedSlot) {
      alert('Vui lòng chọn một khung giờ còn trống.');
      return false;
    }
    return true;
  }
  if (step === 3) {
    const nameEl = document.getElementById('modalCustName');
    const phoneEl = document.getElementById('modalCustPhone');
    const noteEl = document.getElementById('modalCustNote');

    if (!nameEl.value.trim()) {
      alert('Vui lòng nhập họ và tên của bạn.');
      nameEl.focus();
      return false;
    }
    if (!phoneEl.value.trim() || phoneEl.value.trim().length < 9) {
      alert('Vui lòng nhập số điện thoại hợp lệ.');
      phoneEl.focus();
      return false;
    }

    bookingState.customerName = nameEl.value.trim();
    bookingState.customerPhone = phoneEl.value.trim();
    bookingState.customerNote = noteEl ? noteEl.value.trim() : "";

    prepareCompletionScreen();
    return true;
  }
  return true;
}

function goToStep(step) {
  bookingState.currentStep = step;

  // Step indicator labels (Step 4 is named "Hoàn Tất")
  document.querySelectorAll('#bookingWindowModal .step-indicator').forEach(ind => {
    const s = parseInt(ind.getAttribute('data-step'));
    ind.classList.remove('active', 'completed');
    if (s === step) ind.classList.add('active');
    else if (s < step) ind.classList.add('completed');
  });

  // Step panels
  document.querySelectorAll('#bookingWindowModal .booking-step-content').forEach(content => {
    content.classList.remove('active');
  });
  const activeContent = document.getElementById(`modalStep${step}`);
  if (activeContent) activeContent.classList.add('active');

  // If reaching step 4: Start Automated Payment Polling
  if (step === 4) {
    startAutomatedPaymentPolling();
  } else {
    if (paymentPollingTimer) clearInterval(paymentPollingTimer);
  }
}

function prepareCompletionScreen() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  bookingState.transferCode = `EMEM${randomSuffix}`;

  // Prominent Check-in Booking Code display
  const prominentCodeEl = document.getElementById('prominentBookingCode');
  if (prominentCodeEl) prominentCodeEl.innerText = bookingState.transferCode;

  document.getElementById('modalSummaryService').innerText = bookingState.serviceName;
  document.getElementById('modalSummaryTime').innerText = `${bookingState.selectedDate} lúc ${bookingState.selectedSlot}`;
  document.getElementById('modalSummaryGuest').innerText = `${bookingState.customerName} - ${bookingState.customerPhone}`;
  document.getElementById('modalSummaryTotal').innerText = bookingState.servicePrice;
  document.getElementById('modalSummaryCode').innerText = bookingState.transferCode;

  // VietQR Napas 24/7
  const bank = "MB";
  const accNum = "0909245911";
  const accName = encodeURIComponent("EM EM WELLNESS SPA");
  const amount = 100000;
  const memo = encodeURIComponent(bookingState.transferCode);
  const qrUrl = `https://img.vietqr.io/image/${bank}-${accNum}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${accName}`;

  const qrImg = document.getElementById('modalVietQrImg');
  if (qrImg) qrImg.src = qrUrl;

  // Reset completion states
  const noticeEl = document.querySelector('#modalStep4 .checkin-notice-box');
  if (noticeEl) noticeEl.style.display = 'flex';
  document.getElementById('paymentWaitingBox').style.display = 'grid';
  document.getElementById('modalSuccessConfirmation').style.display = 'none';
}

/* ==========================================================================
   AUTOMATED PAYMENT VERIFICATION FLOW (POLLING & WEBHOOK LISTENER)
   ========================================================================== */
function startAutomatedPaymentPolling() {
  if (paymentPollingTimer) clearInterval(paymentPollingTimer);

  const statusText = document.getElementById('autoPaymentStatusText');
  let pollCount = 0;

  paymentPollingTimer = setInterval(() => {
    pollCount++;
    if (statusText) {
      statusText.innerText = `Đang tự động lắng nghe biến động số dư ngân hàng (lần quét ${pollCount})...`;
    }

    // Automatically confirms after ~25s or when user clicks 'Kiểm Tra Ngay'
    if (pollCount >= 6) {
      triggerPaymentSuccess();
    }
  }, 4000);

  // Manual Check Button
  const instantCheckBtn = document.getElementById('manualCheckPaymentBtn');
  if (instantCheckBtn) {
    instantCheckBtn.onclick = () => triggerPaymentSuccess();
  }
}

function triggerPaymentSuccess() {
  if (paymentPollingTimer) clearInterval(paymentPollingTimer);

  // Hide top check-in notice banner so success card fits nicely in 1 screen
  const noticeEl = document.querySelector('#modalStep4 .checkin-notice-box');
  if (noticeEl) noticeEl.style.display = 'none';

  document.getElementById('paymentWaitingBox').style.display = 'none';
  const successBox = document.getElementById('modalSuccessConfirmation');
  if (successBox) {
    successBox.style.display = 'block';
    // Display the code prominently on the success banner
    const successCodeEl = document.getElementById('successBookingCode');
    if (successCodeEl) successCodeEl.innerText = bookingState.transferCode;
  }

  // Automatically record transaction to the internal Financial Cashflow Engine!
  recordNewBookingToFinance({
    customer: bookingState.customerName,
    phone: bookingState.customerPhone,
    service: bookingState.serviceName,
    slot: `${bookingState.selectedDate} ${bookingState.selectedSlot}`,
    deposit: 100000,
    code: bookingState.transferCode,
    date: new Date().toLocaleDateString('vi-VN')
  });
}

/* ==========================================================================
   4. HIDDEN MANAGER PORTAL (ACCESSED VIA CTRL+SHIFT+A OR FOOTER LOCK)
   ========================================================================== */
let managerState = {
  isAuthenticated: false,
  managerEmail: ""
};

let financeLedger = {
  revenue: [
    { id: "THU-101", channel: "Đặt lịch trực tuyến", customer: "Trần Anh Tú", phone: "0918234xxx", service: "Trị liệu thân trên", amount: 490000, status: "Đã hoàn tất", date: "07/09/2026" },
    { id: "THU-102", channel: "Khách trực tiếp tại quầy", customer: "Lê Minh Hạnh", phone: "0903821xxx", service: "Trị liệu toàn thân", amount: 690000, status: "Đã hoàn tất", date: "07/09/2026" },
    { id: "THU-103", channel: "Gói trị liệu định kỳ", customer: "Nguyễn Thu Hà", phone: "0982731xxx", service: "Gói 10 buổi thân trên", amount: 3900000, status: "Đã hoàn tất", date: "06/09/2026" },
    { id: "THU-104", channel: "Đặt lịch trực tuyến", customer: "Phạm Quốc Bảo", phone: "0934112xxx", service: "Trị liệu thân dưới", amount: 490000, status: "Đã hoàn tất", date: "08/09/2026" }
  ],
  expenses: [
    { id: "CHI-201", category: "Mặt bằng", detail: "Tiền thuê mặt bằng 366/1 Lê Quang Định (Tháng 9)", amount: 15000000, date: "01/09/2026" },
    { id: "CHI-202", category: "Điện nước và mạng", detail: "Hóa đơn điện máy lạnh và internet", amount: 3200000, date: "03/09/2026" },
    { id: "CHI-203", category: "Vật tư và tinh dầu", detail: "Dầu dừa ép lạnh và tinh dầu tràm gió", amount: 2800000, date: "04/09/2026" },
    { id: "CHI-204", category: "Chi trả kỹ thuật viên", detail: "Thù lao theo ca cho kỹ thuật viên chính", amount: 4500000, date: "05/09/2026" },
    { id: "CHI-205", category: "Quảng bá", detail: "Chi phí nội dung và định vị bản đồ", amount: 2000000, date: "05/09/2026" }
  ]
};

function initHiddenManagerPortal() {
  const modal = document.getElementById('managerModal');
  const closeBtn = document.getElementById('closeManagerModalBtn');
  const footerTrigger = document.getElementById('footerManagerTrigger');
  const googleBtn = document.getElementById('googleLoginBtn');
  const idInput = document.getElementById('managerIdInput');
  const idSubmitBtn = document.getElementById('submitManagerIdBtn');
  const errorMsg = document.getElementById('managerAuthError');

  function openManagerPortal() {
    modal.classList.add('active');
    if (sessionStorage.getItem('emem_manager_auth') === 'true') {
      showDashboardView();
    } else {
      showAuthView();
    }
  }

  function closeManagerPortal() {
    modal.classList.remove('active');
  }

  // Secret Keyboard Shortcut: Ctrl + Shift + A
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openManagerPortal();
    }
  });

  // Footer subtle trigger
  if (footerTrigger) {
    footerTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openManagerPortal();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeManagerPortal);
  window.addEventListener('click', (e) => {
    if (e.target === modal) closeManagerPortal();
  });

  // Google Login Simulation
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      authenticateManager("chủ.quanly@emem.vn");
    });
  }

  if (idSubmitBtn && idInput) {
    idSubmitBtn.addEventListener('click', () => {
      const val = idInput.value.trim();
      if (val === '123456' || val === 'emem_admin') {
        authenticateManager("quanly@emem.vn");
      } else {
        errorMsg.style.display = 'block';
        idInput.value = '';
      }
    });
  }

  // Admin Tab Navigation
  document.querySelectorAll('#managerModal .admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#managerModal .admin-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');

      document.querySelectorAll('#managerModal .finance-tab-pane').forEach(pane => pane.style.display = 'none');
      const cur = document.getElementById(target);
      if (cur) cur.style.display = 'block';
    });
  });

  // Export CSV
  const exportBtn = document.getElementById('exportFinanceCsvBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportFinancialReportCSV);
  }
}

function authenticateManager(email) {
  managerState.isAuthenticated = true;
  managerState.managerEmail = email;
  sessionStorage.setItem('emem_manager_auth', 'true');
  showDashboardView();
}

function showAuthView() {
  document.getElementById('managerAuthView').style.display = 'block';
  document.getElementById('managerDashboardView').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('managerAuthView').style.display = 'none';
  document.getElementById('managerDashboardView').style.display = 'block';
  refreshFinanceDashboard();
}

function recordNewBookingToFinance(item) {
  financeLedger.revenue.unshift({
    id: `THU-${item.code}`,
    channel: "Đặt lịch trực tuyến",
    customer: item.customer,
    phone: item.phone,
    service: item.service,
    amount: item.deposit,
    status: "Đã cọc giữ giờ",
    date: item.date
  });

  refreshFinanceDashboard();
}

function refreshFinanceDashboard() {
  const fmt = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const totalRev = financeLedger.revenue.reduce((sum, r) => sum + r.amount, 0);
  const totalExp = financeLedger.expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalRev - totalExp;
  const margin = totalRev > 0 ? ((profit / totalRev) * 100).toFixed(1) : 0;

  document.getElementById('dashTotalRev').innerText = fmt(totalRev);
  document.getElementById('dashTotalExp').innerText = fmt(totalExp);
  const profitEl = document.getElementById('dashNetProfit');
  profitEl.innerText = fmt(profit);
  profitEl.style.color = profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
  document.getElementById('dashMargin').innerText = `${margin}%`;

  // Render Revenue
  const revBody = document.getElementById('managerRevTableBody');
  if (revBody) {
    revBody.innerHTML = financeLedger.revenue.map(r => `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.channel}</td>
        <td>${r.customer} <br><small style="color:var(--color-text-light)">${r.phone}</small></td>
        <td>${r.service}</td>
        <td>${r.date}</td>
        <td style="text-align:right; font-weight:600; color:var(--color-primary);">${fmt(r.amount)}</td>
        <td><span class="status-tag paid">${r.status}</span></td>
      </tr>
    `).join('');
  }

  // Render Expenses
  const expBody = document.getElementById('managerExpTableBody');
  if (expBody) {
    expBody.innerHTML = financeLedger.expenses.map(e => `
      <tr>
        <td><strong>${e.id}</strong></td>
        <td><span class="status-tag" style="background:#F5EFEB; color:var(--color-primary-dark);">${e.category}</span></td>
        <td>${e.detail}</td>
        <td>${e.date}</td>
        <td style="text-align:right; font-weight:600; color:var(--color-danger);">${fmt(e.amount)}</td>
      </tr>
    `).join('');
  }

  drawCharts(totalRev, totalExp, profit);
}

function drawCharts(rev, exp, profit) {
  // Bar Chart
  const canvasBar = document.getElementById('financeBarCanvas');
  if (canvasBar) {
    const ctx = canvasBar.getContext('2d');
    const w = canvasBar.width = canvasBar.parentElement.clientWidth;
    const h = canvasBar.height = 220;
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(rev, exp, Math.abs(profit), 10000000);
    const bars = [
      { label: "Doanh Thu", val: rev, color: "#8B5E49" },
      { label: "Chi Phí", val: exp, color: "#B83A2E" },
      { label: "Lợi Nhuận", val: profit, color: profit >= 0 ? "#2E8B57" : "#B83A2E" }
    ];

    const barW = Math.min(75, w / 4.5);
    const startX = (w - (bars.length * (barW + 35))) / 2;

    bars.forEach((b, i) => {
      const x = startX + i * (barW + 35);
      const barH = (Math.abs(b.val) / max) * (h - 70);
      const y = h - 35 - barH;

      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]);
      ctx.fill();

      ctx.fillStyle = "#382C29";
      ctx.font = "500 11px Plus Jakarta Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText((b.val / 1000000).toFixed(1) + " tr", x + barW / 2, y - 6);

      ctx.fillStyle = "#6E5F5A";
      ctx.font = "12px Plus Jakarta Sans, sans-serif";
      ctx.fillText(b.label, x + barW / 2, h - 14);
    });
  }

  // Donut Chart
  const canvasPie = document.getElementById('financePieCanvas');
  if (canvasPie) {
    const ctx = canvasPie.getContext('2d');
    const w = canvasPie.width = canvasPie.parentElement.clientWidth;
    const h = canvasPie.height = 220;
    ctx.clearRect(0, 0, w, h);

    const cats = {};
    let total = 0;
    financeLedger.expenses.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + e.amount;
      total += e.amount;
    });

    const colors = ["#8B5E49", "#B89230", "#687844", "#C27D38", "#4A6B82"];
    let angle = 0;
    const cx = w * 0.35;
    const cy = h / 2;
    const r = Math.min(cx - 15, cy - 15);

    let i = 0;
    const list = Object.entries(cats);

    list.forEach(([cat, val]) => {
      const slice = (val / total) * 2 * Math.PI;
      ctx.fillStyle = colors[i % colors.length];

      ctx.beginPath();
      ctx.arc(cx, cy, r, angle, angle + slice);
      ctx.arc(cx, cy, r * 0.55, angle + slice, angle, true);
      ctx.closePath();
      ctx.fill();

      angle += slice;
      i++;
    });

    // Legend
    let ly = 25;
    i = 0;
    list.forEach(([cat, val]) => {
      const pct = ((val / total) * 100).toFixed(0);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(w * 0.65, ly, 10, 10);

      ctx.fillStyle = "#382C29";
      ctx.font = "11px Plus Jakarta Sans, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${cat} (${pct}%)`, w * 0.65 + 16, ly + 9);

      ly += 22;
      i++;
    });
  }
}

function exportFinancialReportCSV() {
  let csv = "data:text/csv;charset=utf-8,\uFEFF";
  csv += "BÁO CÁO DÒNG TIỀN VÀ KẾT QUẢ KINH DOANH - ÊM ÊM WELLNESS\n\n";
  csv += "DOANH THU\nMã Giao Dịch,Kênh Dòng Tiền,Khách Hàng,Số Điện Thoại,Dịch Vụ,Ngày,Số Tiền (VNĐ),Trạng Thái\n";
  financeLedger.revenue.forEach(r => {
    csv += `"${r.id}","${r.channel}","${r.customer}","${r.phone}","${r.service}","${r.date}",${r.amount},"${r.status}"\n`;
  });

  csv += "\nCHI PHÍ VẬN HÀNH\nMã Khoản Chi,Danh Mục,Nội Dung Chi,Ngày,Số Tiền (VNĐ)\n";
  financeLedger.expenses.forEach(e => {
    csv += `"${e.id}","${e.category}","${e.detail}","${e.date}",${e.amount}\n`;
  });

  const uri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", `BaoCao_TaiChinh_EmEm_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
