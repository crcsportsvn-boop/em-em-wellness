/**
 * ÊM ÊM WELLNESS - CORE APPLICATION SCRIPT
 * Features:
 *  - 3D Human Atlas Anatomical Viewer (Three.js 360° auto-rotation & muscle highlight)
 *  - Dedicated Booking Window / Modal with 5 Services (3 top, 2 bottom)
 *  - Instant Booking with Unique Check-in Code Display (Deposit-free)
 *  - 1-Screen Optimized Layout for Mobile Viewport
 */

import * as THREE from 'three';
import { 
  initAtlasViewer, 
  fitCameraToWindow, 
  updateActivePackageHighlight, 
  highlightMuscleOnHover, 
  resetMuscleHover,
  preloadAtlasViewer 
} from './atlas-viewer.js';

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initBookingWindow();
  initAnatomyModals();
  preloadAtlasInBackground();
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
    activeMuscles: ['scm', 'splenius', 'trapezius', 'rhomboids', 'rotator_cuff', 'deltoids', 'pectorals', 'arm_biceps_triceps', 'arm_forearm'],
    muscles: [
      { id: 'scm', name: "Cơ ức đòn chũm & cổ" },
      { id: 'trapezius', name: "Cơ thang vai gáy" },
      { id: 'rhomboids', name: "Cơ trám bả vai" },
      { id: 'rotator_cuff', name: "Chóp xoay khớp vai" },
      { id: 'deltoids', name: "Cơ Delta bả vai" },
      { id: 'pectorals', name: "Cơ ngực lớn & nhỏ" },
      { id: 'arm_biceps_triceps', name: "Cơ bắp tay trước - sau" },
      { id: 'arm_forearm', name: "Cơ cẳng tay & cổ tay" }
    ]
  },
  lower: {
    key: "lower",
    title: "Trị Liệu Thân Dưới",
    duration: "60 phút",
    activeMuscles: ['quadratus_lumborum', 'erector_spinae', 'gluteals', 'piriformis', 'quadriceps', 'hamstrings_upper', 'calves', 'shin_foot'],
    muscles: [
      { id: 'quadratus_lumborum', name: "Cơ vuông thắt lưng" },
      { id: 'erector_spinae', name: "Cơ dựng sống thắt lưng" },
      { id: 'gluteals', name: "Nhóm cơ mông" },
      { id: 'piriformis', name: "Cơ hình lê (khớp háng)" },
      { id: 'quadriceps', name: "Cơ tứ đầu đùi trước" },
      { id: 'hamstrings_upper', name: "Cơ gân kheo đùi sau" },
      { id: 'calves', name: "Cơ bắp chuối & gân gót" },
      { id: 'shin_foot', name: "Cơ cẳng chân & mu chân" }
    ]
  },
  full: {
    key: "full",
    title: "Trị Liệu Toàn Thân",
    duration: "90 phút",
    activeMuscles: [
      'full_neck_head', 'full_upper_back_chest', 'full_arms_hands',
      'full_lower_back', 'full_glutes_hip', 'full_thighs', 'full_calves', 'full_feet'
    ],
    muscles: [
      { id: 'full_neck_head', name: "Cổ vai gáy & chẩm đầu" },
      { id: 'full_upper_back_chest', name: "Lưng trên & lồng ngực" },
      { id: 'full_arms_hands', name: "Hai cánh tay & cổ tay" },
      { id: 'full_lower_back', name: "Thắt lưng & dựng sống" },
      { id: 'full_glutes_hip', name: "Khung chậu & cơ mông" },
      { id: 'full_thighs', name: "Đùi trước & đùi sau" },
      { id: 'full_calves', name: "Bắp chuối & gân gót" },
      { id: 'full_feet', name: "Cẳng chân & bàn chân" }
    ]
  }
};

let currentActivePackageKey = 'upper';
let currentFocusedMuscleId = null;

function preloadAtlasInBackground() {
  const start = () => {
    setTimeout(() => {
      preloadAtlasViewer();
    }, 800);
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(start, { timeout: 2000 });
  } else {
    window.addEventListener('load', start, { once: true });
  }
}

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

  // Render lại cột thông tin y khoa dạng danh sách chip cơ tinh gọn
  renderAtlasDetailsColumn(data);
}

/**
 * Render danh sách nhóm cơ dạng chip nhỏ gọn, vừa khít 1 screen điện thoại
 */
function renderAtlasDetailsColumn(data) {
  const body = document.getElementById('anatomyContentBody');
  if (!body) return;

  body.innerHTML = `
    <div class="atlas-card-body-inner">
      <div class="atlas-muscles-section">
        <div class="atlas-section-subtitle">CÁC NHÓM CƠ TRỊ LIỆU TRỌNG ĐIỂM:</div>
        <div class="atlas-muscles-chips">
          ${data.muscles.map(m => `
            <button type="button" class="muscle-chip ${currentFocusedMuscleId === m.id ? 'active' : ''}" data-muscle-id="${m.id}" title="${m.name}">
              <span class="chip-star">✦</span>
              <span class="chip-name">${m.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="atlas-actions-row">
        <button type="button" class="btn btn-primary atlas-book-btn" onclick="openBookingWithService('${data.title}', '${data.duration}')">
          Đặt Chỗ Gói Này (${data.duration})
        </button>
      </div>
    </div>
  `;

  // Gắn sự kiện click và hover vào từng chip cơ
  body.querySelectorAll('.muscle-chip').forEach(chip => {
    const muscleId = chip.getAttribute('data-muscle-id');

    chip.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentFocusedMuscleId === muscleId) {
        currentFocusedMuscleId = null;
        resetMuscleHover();
        chip.classList.remove('active');
      } else {
        currentFocusedMuscleId = muscleId;
        highlightMuscleOnHover(muscleId);
        body.querySelectorAll('.muscle-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      }
    });

    chip.addEventListener('mouseenter', () => {
      highlightMuscleOnHover(muscleId);
    });

    chip.addEventListener('mouseleave', () => {
      if (currentFocusedMuscleId) {
        highlightMuscleOnHover(currentFocusedMuscleId);
      } else {
        resetMuscleHover();
      }
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

  // Hiển thị nội dung chi tiết y khoa ngay lập tức không cần đợi
  switchAtlasPackage(pkgKey);

  // Khởi tạo hoặc cập nhật Three.js atlas
  initAtlasViewer();

  // Đảm bảo camera và canvas Three.js luôn vừa khít khung nhìn
  requestAnimationFrame(() => fitCameraToWindow(true));
  setTimeout(() => fitCameraToWindow(true), 100);
  setTimeout(() => fitCameraToWindow(true), 320);
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
   3. DEDICATED BOOKING WINDOW / MODAL WITH 5 SERVICES (DEPOSIT-FREE)
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
  bookingCode: "",
  currentStep: 1
};

function initBookingWindow() {
  generateDateList();
  initServiceSelection();
  initSlotPicker();
  initWizardNavigation();

  // Gắn trigger cho tất cả nút "Đặt Chỗ Ngay" trên toàn trang
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

    // Highlight thẻ dịch vụ tương ứng
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
}
window.closeBookingWindow = closeBookingWindow;

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
      <div style="font-size: 0.65rem; opacity: 0.8;">Tháng ${monthNum}</div>
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

  // Chỉ báo các bước (1-4)
  document.querySelectorAll('#bookingWindowModal .step-indicator').forEach(ind => {
    const s = parseInt(ind.getAttribute('data-step'));
    ind.classList.remove('active', 'completed');
    if (s === step) ind.classList.add('active');
    else if (s < step) ind.classList.add('completed');
  });

  // Chuyển panel bước tương ứng
  document.querySelectorAll('#bookingWindowModal .booking-step-content').forEach(content => {
    content.classList.remove('active');
  });
  const activeContent = document.getElementById(`modalStep${step}`);
  if (activeContent) activeContent.classList.add('active');
}

function prepareCompletionScreen() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  bookingState.bookingCode = `EMEM${randomSuffix}`;

  // Hiển thị mã đặt chỗ check-in nổi bật
  const prominentCodeEl = document.getElementById('prominentBookingCode');
  if (prominentCodeEl) prominentCodeEl.innerText = bookingState.bookingCode;

  const servEl = document.getElementById('modalSummaryService');
  if (servEl) servEl.innerText = bookingState.serviceName;

  const timeEl = document.getElementById('modalSummaryTime');
  if (timeEl) timeEl.innerText = `${bookingState.selectedDate} lúc ${bookingState.selectedSlot}`;

  const guestEl = document.getElementById('modalSummaryGuest');
  if (guestEl) guestEl.innerText = `${bookingState.customerName} - ${bookingState.customerPhone}`;

  const totalEl = document.getElementById('modalSummaryTotal');
  if (totalEl) totalEl.innerText = bookingState.servicePrice;
}
