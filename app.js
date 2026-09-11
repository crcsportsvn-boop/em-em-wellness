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
  preloadAtlasViewer,
  startAnimationLoop,
  stopAnimationLoop
} from './atlas-viewer.js';
import { initI18n, getCurrentLang, t } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
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
    titleEn: "Upper Body Therapy",
    duration: "60 phút",
    durationEn: "60 minutes",
    activeMuscles: ['scm', 'splenius', 'trapezius', 'rhomboids', 'rotator_cuff', 'deltoids', 'pectorals', 'arm_biceps_triceps', 'arm_forearm'],
    muscles: [
      { id: 'scm', name: "Cơ ức đòn chũm & cổ", nameEn: "Sternocleidomastoid & neck" },
      { id: 'trapezius', name: "Cơ thang vai gáy", nameEn: "Trapezius muscle" },
      { id: 'rhomboids', name: "Cơ trám bả vai", nameEn: "Rhomboids" },
      { id: 'rotator_cuff', name: "Chóp xoay khớp vai", nameEn: "Rotator cuff" },
      { id: 'deltoids', name: "Cơ Delta bả vai", nameEn: "Deltoids" },
      { id: 'pectorals', name: "Cơ ngực lớn & nhỏ", nameEn: "Pectoral muscles" },
      { id: 'arm_biceps_triceps', name: "Cơ bắp tay trước - sau", nameEn: "Biceps & triceps" },
      { id: 'arm_forearm', name: "Cơ cẳng tay & cổ tay", nameEn: "Forearm & wrist flexors" }
    ]
  },
  lower: {
    key: "lower",
    title: "Trị Liệu Thân Dưới",
    titleEn: "Lower Body Therapy",
    duration: "60 phút",
    durationEn: "60 minutes",
    activeMuscles: ['quadratus_lumborum', 'erector_spinae', 'gluteals', 'piriformis', 'quadriceps', 'hamstrings_upper', 'calves', 'shin_foot'],
    muscles: [
      { id: 'quadratus_lumborum', name: "Cơ vuông thắt lưng", nameEn: "Quadratus lumborum" },
      { id: 'erector_spinae', name: "Cơ dựng sống thắt lưng", nameEn: "Erector spinae" },
      { id: 'gluteals', name: "Nhóm cơ mông", nameEn: "Gluteal muscles" },
      { id: 'piriformis', name: "Cơ hình lê (khớp háng)", nameEn: "Piriformis (hip joint)" },
      { id: 'quadriceps', name: "Cơ tứ đầu đùi trước", nameEn: "Quadriceps" },
      { id: 'hamstrings_upper', name: "Cơ gân kheo đùi sau", nameEn: "Hamstrings" },
      { id: 'calves', name: "Cơ bắp chuối & gân gót", nameEn: "Calves & Achilles" },
      { id: 'shin_foot', name: "Cơ cẳng chân & mu chân", nameEn: "Shin & foot dorsum" }
    ]
  },
  full: {
    key: "full",
    title: "Trị Liệu Toàn Thân",
    titleEn: "Full Body Therapy",
    duration: "90 phút",
    durationEn: "90 minutes",
    activeMuscles: [
      'full_neck_head', 'full_upper_back_chest', 'full_arms_hands',
      'full_lower_back', 'full_glutes_hip', 'full_thighs', 'full_calves', 'full_feet'
    ],
    muscles: [
      { id: 'full_neck_head', name: "Cổ vai gáy & chẩm đầu", nameEn: "Neck, shoulders & occiput" },
      { id: 'full_upper_back_chest', name: "Lưng trên & lồng ngực", nameEn: "Upper back & thoracic" },
      { id: 'full_arms_hands', name: "Hai cánh tay & cổ tay", nameEn: "Arms & wrists" },
      { id: 'full_lower_back', name: "Thắt lưng & dựng sống", nameEn: "Lumbar spine & erectors" },
      { id: 'full_glutes_hip', name: "Khung chậu & cơ mông", nameEn: "Pelvis & gluteals" },
      { id: 'full_thighs', name: "Đùi trước & đùi sau", nameEn: "Anterior & posterior thighs" },
      { id: 'full_calves', name: "Bắp chuối & gân gót", nameEn: "Calves & Achilles" },
      { id: 'full_feet', name: "Cẳng chân & bàn chân", nameEn: "Lower legs & feet" }
    ]
  }
};

let currentActivePackageKey = 'upper';
let currentFocusedMuscleId = null;

function preloadAtlasInBackground() {
  // Tải ngầm danh mục atlas.json khi rảnh rỗi để không nghẽn băng thông lúc vừa vào trang
  const lazyWarmup = () => {
    fetch('/models/atlas.json', { priority: 'low' }).catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(lazyWarmup, { timeout: 3000 });
  } else {
    window.addEventListener('load', () => setTimeout(lazyWarmup, 1500), { once: true });
  }

  // Tiền khởi tạo khi người dùng rê chuột/chuẩn bị nhấn vào nút Chi Tiết Trị Liệu
  document.querySelectorAll('[data-anatomy]').forEach(btn => {
    btn.addEventListener('pointerenter', () => {
      preloadAtlasViewer();
    }, { once: true });
  });
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

  const isEn = getCurrentLang() === 'en';
  const pkgTitle = isEn ? (data.titleEn || data.title) : data.title;
  const pkgDuration = isEn ? (data.durationEn || data.duration) : data.duration;
  const subtitleText = isEn ? "KEY TARGETED MUSCLE GROUPS:" : "CÁC NHÓM CƠ TRỊ LIỆU TRỌNG ĐIỂM:";
  const bookBtnText = isEn ? `Book This Session (${pkgDuration})` : `Đặt Chỗ Gói Này (${pkgDuration})`;

  body.innerHTML = `
    <div class="atlas-card-body-inner">
      <div class="atlas-muscles-section">
        <div class="atlas-section-subtitle">${subtitleText}</div>
        <div class="atlas-muscles-chips">
          ${data.muscles.map(m => {
            const mName = isEn ? (m.nameEn || m.name) : m.name;
            return `
            <button type="button" class="muscle-chip ${currentFocusedMuscleId === m.id ? 'active' : ''}" data-muscle-id="${m.id}" title="${mName}">
              <span class="chip-star">✦</span>
              <span class="chip-name">${mName}</span>
            </button>
          `}).join('')}
        </div>
      </div>

      <div class="atlas-actions-row">
        <button type="button" class="btn btn-primary atlas-book-btn" onclick="openBookingWithService('${pkgTitle}', '${pkgDuration}')">
          ${bookBtnText}
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
  startAnimationLoop();

  // Đảm bảo camera và canvas Three.js luôn vừa khít khung nhìn
  requestAnimationFrame(() => fitCameraToWindow(true));
  setTimeout(() => fitCameraToWindow(true), 100);
  setTimeout(() => fitCameraToWindow(true), 320);
}

function closeAnatomyModal() {
  const modal = document.getElementById('anatomyModal');
  if (modal) modal.classList.remove('active');
  // Dừng vòng lặp Three.js ngay lập tức để giải phóng 100% tài nguyên CPU/GPU
  stopAnimationLoop();
}

// Tạm dừng Three.js khi chuyển tab để chống lag và tiết kiệm pin
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAnimationLoop();
  } else {
    const modal = document.getElementById('anatomyModal');
    if (modal && modal.classList.contains('active')) {
      startAnimationLoop();
    }
  }
});

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
  selectedDayIndex: 0,
  customerName: "",
  customerPhone: "",
  customerNote: "",
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

  // Làm mới ngày và cập nhật các khung giờ khả dụng theo thời gian thực
  generateDateList();

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

  const isEn = getCurrentLang() === 'en';
  const daysOfWeek = isEn 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();
  container.innerHTML = '';

  const activeDayIndex = bookingState.selectedDayIndex || 0;

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);

    const dayName = i === 0 ? (isEn ? 'Today' : 'Hôm nay') : daysOfWeek[d.getDay()];
    const dateNum = d.getDate();
    const monthNum = d.getMonth() + 1;
    const monthText = isEn ? `Month ${monthNum}` : `Tháng ${monthNum}`;

    const isSelected = i === activeDayIndex;
    const dateItem = document.createElement('div');
    dateItem.className = `date-item ${isSelected ? 'selected' : ''}`;
    dateItem.innerHTML = `
      <div class="date-day">${dayName}</div>
      <div class="date-num">${dateNum}</div>
      <div style="font-size: 0.65rem; opacity: 0.8;">${monthText}</div>
    `;

    if (isSelected) {
      bookingState.selectedDate = `${dayName}, ${dateNum}/${monthNum}`;
      bookingState.selectedDayIndex = i;
    }

    dateItem.addEventListener('click', () => {
      container.querySelectorAll('.date-item').forEach(el => el.classList.remove('selected'));
      dateItem.classList.add('selected');
      bookingState.selectedDate = `${dayName}, ${dateNum}/${monthNum}`;
      bookingState.selectedDayIndex = i;
      updateSlots(i);
    });

    container.appendChild(dateItem);
  }

  updateSlots(bookingState.selectedDayIndex);
}

function updateSlots(dayIndex) {
  const slotButtons = document.querySelectorAll('#bookingWindowModal .slot-btn');
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  let visibleCount = 0;

  slotButtons.forEach((btn) => {
    btn.classList.remove('selected');

    // Lấy giờ bắt đầu từ data-slot hoặc text (vd: "09:00 - 10:00" -> 9h00)
    const slotStr = btn.getAttribute('data-slot') || btn.innerText.trim();
    const timeMatch = slotStr.match(/(\d{1,2}):(\d{2})/);
    let isPast = false;

    // Nếu chọn ngày hôm nay (dayIndex === 0), kiểm tra xem giờ ca đã qua chưa
    if (dayIndex === 0 && timeMatch) {
      const slotHour = parseInt(timeMatch[1], 10);
      const slotMinute = parseInt(timeMatch[2], 10);
      const slotMinutes = slotHour * 60 + slotMinute;
      if (slotMinutes <= currentTotalMinutes) {
        isPast = true;
      }
    }

    if (isPast) {
      // Ẩn đi hoàn toàn giờ quá khứ để người dùng không chọn được
      btn.style.display = 'none';
      btn.disabled = true;
    } else {
      btn.style.display = '';
      btn.disabled = false;
      visibleCount++;
    }
  });

  bookingState.selectedSlot = "";

  // Quản lý thông báo khi hôm nay đã hết tất cả khung giờ nhận khách
  const noticeEl = document.getElementById('noSlotsTodayNotice');
  if (noticeEl) {
    if (dayIndex === 0 && visibleCount === 0) {
      noticeEl.style.display = 'block';
    } else {
      noticeEl.style.display = 'none';
    }
  }
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
      alert(t('alertSelectPackage'));
      return false;
    }
    return true;
  }
  if (step === 2) {
    if (!bookingState.selectedSlot) {
      alert(t('alertSelectSlot'));
      return false;
    }
    // Xác thực an toàn: Đảm bảo không chọn khung giờ đã trôi qua trong ngày hôm nay
    if (bookingState.selectedDayIndex === 0) {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      const match = bookingState.selectedSlot.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const slotMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        if (slotMinutes <= currentTotalMinutes) {
          alert(t('alertSlotPassed'));
          return false;
        }
      }
    }
    return true;
  }
  if (step === 3) {
    const nameEl = document.getElementById('modalCustName');
    const phoneEl = document.getElementById('modalCustPhone');
    const noteEl = document.getElementById('modalCustNote');

    if (!nameEl.value.trim()) {
      alert(t('alertEnterName'));
      nameEl.focus();
      return false;
    }
    if (!phoneEl.value.trim() || phoneEl.value.trim().length < 9) {
      alert(t('alertEnterPhone'));
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
  const isEn = getCurrentLang() === 'en';
  const servEl = document.getElementById('modalSummaryService');
  if (servEl) servEl.innerText = bookingState.serviceName;

  const timeEl = document.getElementById('modalSummaryTime');
  const atWord = isEn ? 'at' : 'lúc';
  if (timeEl) timeEl.innerText = `${bookingState.selectedDate} ${atWord} ${bookingState.selectedSlot}`;

  const guestEl = document.getElementById('modalSummaryGuest');
  if (guestEl) guestEl.innerText = `${bookingState.customerName} - ${bookingState.customerPhone}`;

  const totalEl = document.getElementById('modalSummaryTotal');
  if (totalEl) totalEl.innerText = bookingState.servicePrice;
}

// Lắng nghe sự kiện chuyển đổi ngôn ngữ để đồng bộ hoá ngay các phần động
window.addEventListener('languageChanged', () => {
  generateDateList();
  const anatomyModal = document.getElementById('anatomyModal');
  if (anatomyModal && anatomyModal.classList.contains('active')) {
    switchAtlasPackage(currentActivePackageKey);
  }
  if (bookingState.currentStep === 4) {
    prepareCompletionScreen();
  }
});
