let imageList = []; // 불러온 이미지 객체 리스트
let directoryHandle = null;
let currentImageIndex = 0; // 현재 보고 있는 이미지 인덱스
let currentImage = null; // 현재 표시 중인 이미지 소스

// 뷰어 상태
let currentRotation = 0;
let currentZoom = 1;
let zoomOriginX = 0.5;
let zoomOriginY = 0.5;

// 패닝 상태
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartScrollX = 0;
let panStartScrollY = 0;

// 라벨링 데이터
let labelPoints = [];
let spatterData = [];

// [추가됨] 불티 추가 모드 상태 변수
let isAddingSpatter = false;
let tempSpatterPoints = []; // 찍고 있는 점들 저장

// [추가됨] 용접부 추가 모드 상태 변수
let isAddingWeld = false;

// [추가됨] 용접부 이동 관련 변수
let isDraggingWeldZone = false;
let weldDragStartPos = { x: 0, y: 0 };

// [추가됨] 불티 포인트 드래그 관련 변수
let isDraggingSpatterPoint = false;
let draggingSpatterIndex = -1; // 수정 중인 불티의 인덱스
let draggingPointIndex = -1; // 수정 중인 점의 인덱스

// [추가됨] 캡션에서 추출한 용접부 정보 저장용
let currentWeldSize = "-";
let currentWeldRange = "-";

// [추가] 현재 불러온 JSON 원본 데이터를 저장할 변수
let currentJsonData = null;

// [수정] 초기 로딩 중인지 확인하는 플래그 (원본 텍스트 유지를 위해)
let isJsonLoading = false;

// [추가] 사용자가 데이터를 수정했는지 여부 (초기 로딩 시 값 유지용)
let isUserModified = false;

// [수정됨] 상태 분리: 필터와 정렬을 독립적으로 관리
let filterState = { type: 0 }; // 0:전체, 1:정상, 2:이상
let sortState = { col: null, order: 0 }; // order: 1(오름차순), 2(내림차순)

let selectedSpatterId = null; // 현재 선택된 불티 ID 저장

const THUMB_HEIGHT = 150; // 아이템 높이(160px) + 간격(10px)
const BUFFER_COUNT = 5; // 스크롤 시 끊김 방지를 위해 위아래로 미리 렌더링할 개수

const METADATA_MAP = {
  // 1. 작업 장소 (work_location)
  location: {
    1: "실내",
    2: "실외",
  },
  // 2. 작업 방식 (work_method)
  method: {
    1: "MIG",
    2: "아크",
    3: "레이저",
    4: "산소",
  },
  // 3. 진행 단계 (weld_progress)
  progress: {
    1: "발생단계",
    2: "비산1단계",
    3: "비산2단계",
    4: "비산3단계",
    5: "소멸단계",
  },
  // ==== env ====
  gas_type: {
    1: "혼합가스",
    2: "아르곤",
    3: "산소",
    4: "질소",
    5: "LPG",
    6: "해당없음",
  },
};

// [원복됨] 온도-RGB 매핑 테이블 (사용자 정의 기준)
// 50도(흰색)부터 25도씩 증가, 700도까지
const TEMP_MAP1 = [
  { temp: 50, r: 255, g: 255, b: 255 }, // 흰색 (배경)
  { temp: 75, r: 204, g: 0, b: 255 },
  { temp: 100, r: 153, g: 0, b: 255 },
  { temp: 125, r: 102, g: 0, b: 255 },
  { temp: 150, r: 51, g: 0, b: 255 },
  { temp: 175, r: 0, g: 0, b: 255 },
  { temp: 200, r: 0, g: 51, b: 255 }, // 이상 불티 기준 (200도 이상)
  { temp: 225, r: 0, g: 102, b: 255 },
  { temp: 250, r: 0, g: 153, b: 255 },
  { temp: 275, r: 0, g: 204, b: 255 },
  { temp: 300, r: 0, g: 255, b: 255 },
  { temp: 325, r: 0, g: 255, b: 204 },
  { temp: 350, r: 0, g: 255, b: 153 },
  { temp: 375, r: 0, g: 255, b: 102 },
  { temp: 400, r: 0, g: 255, b: 51 },
  { temp: 425, r: 0, g: 255, b: 0 },
  { temp: 450, r: 51, g: 255, b: 0 },
  { temp: 475, r: 102, g: 255, b: 0 },
  { temp: 500, r: 153, g: 255, b: 0 },
  { temp: 525, r: 204, g: 255, b: 0 },
  { temp: 550, r: 255, g: 255, b: 0 },
  { temp: 575, r: 255, g: 204, b: 0 },
  { temp: 600, r: 255, g: 153, b: 0 },
  { temp: 625, r: 255, g: 102, b: 0 },
  { temp: 650, r: 255, g: 51, b: 0 },
  { temp: 675, r: 255, g: 0, b: 0 },
  { temp: 700, r: 255, g: 0, b: 51 }, // 255, 0, 51 (수정 반영)
];

// [수정됨] 레벨별 RGB 매핑 (Level 1 = 50도 부터 25도씩 증가)
const TEMP_MAP2 = [
  // [Level 1 ~ 10]
  { temp: 50, r: 11, g: 11, b: 142 },
  { temp: 75, r: 11, g: 26, b: 161 },
  { temp: 100, r: 10, g: 44, b: 181 },
  { temp: 125, r: 9, g: 66, b: 201 },
  { temp: 150, r: 7, g: 92, b: 222 },
  { temp: 175, r: 5, g: 122, b: 243 },
  { temp: 200, r: 13, g: 155, b: 253 }, // 이상 불티 기준
  { temp: 225, r: 27, g: 190, b: 255 },
  { temp: 250, r: 35, g: 236, b: 255 },
  { temp: 275, r: 43, g: 255, b: 231 },

  // [Level 11 ~ 20]
  { temp: 300, r: 50, g: 255, b: 192 },
  { temp: 325, r: 58, g: 255, b: 155 },
  { temp: 350, r: 65, g: 255, b: 121 },
  { temp: 375, r: 73, g: 255, b: 91 },
  { temp: 400, r: 91, g: 255, b: 71 },
  { temp: 425, r: 125, g: 255, b: 60 },
  { temp: 450, r: 163, g: 255, b: 48 },
  { temp: 475, r: 207, g: 255, b: 37 },
  { temp: 500, r: 255, g: 255, b: 26 },
  { temp: 525, r: 255, g: 201, b: 14 },

  // [Level 21 ~ 28]
  { temp: 550, r: 255, g: 143, b: 3 },
  { temp: 575, r: 244, g: 110, b: 2 },
  { temp: 600, r: 231, g: 88, b: 5 },
  { temp: 625, r: 217, g: 69, b: 7 },
  { temp: 650, r: 204, g: 52, b: 9 },
  { temp: 675, r: 191, g: 37, b: 11 },
  { temp: 700, r: 178, g: 24, b: 12 },
  { temp: 725, r: 165, g: 13, b: 13 },
];

/**
 * [폴더 선택 핸들러]
 * 폴더 단위로 불러올 때 실행
 */
function handleFolderSelect(event) {
  const files = Array.from(event.target.files);
  loadImages(files);
  event.target.value = "";
}

/**
 * [인덱스 컬럼 너비 자동 계산 함수]
 * - 이미지 총 개수에 따라 인덱스 영역의 너비를 최적화합니다.
 * - 예: 9개 -> 좁게, 9999개 -> 넓게
 */
function updateIndexColumnWidth() {
  const listContainer = document.getElementById("thumbnailList");
  if (!listContainer) return;

  // 1. 가장 큰 인덱스 (총 개수)
  const maxCount = imageList.length;
  
  // 2. 자릿수 계산 (1 -> 1자리, 100 -> 3자리)
  // 데이터가 없으면 기본 1자리 취급
  const digits = maxCount > 0 ? maxCount.toString().length : 1;
  
  // 3. 너비 계산 공식
  // 기본 여백(15px) + (자릿수 * 글자당 약 8px)
  // 예: 1자리(9) -> 23px
  // 예: 3자리(999) -> 39px
  // 예: 4자리(9999) -> 47px
  const calculatedWidth = 5 + (digits * 5);

  // 4. CSS 변수에 적용
  listContainer.style.setProperty('--index-width', `${calculatedWidth}px`);
}

/**
 * [이미지 및 JSON 로드 로직 - 최종 수정]
 * - 기능 1: 유효한 파일 필터링 (DEL_ 파일 포함)
 * - 기능 2: 로컬 스토리지에서 상태 복원
 * - 기능 3: [NEW] 마지막 작업 위치를 찾아 자동으로 다음 이미지 포커싱
 */
function loadImages(files) {
  // 0. 초기화 작업
  currentImageIndex = 0;
  currentZoom = 1;
  currentRotation = 0;
  labelPoints = [];

  const imageContainer = document.getElementById("imageContainer");
  if (imageContainer) {
    imageContainer.innerHTML = "";
  }

  // 좌표 패널 초기화
  updateSpatterList();

  // 1. 유효한 파일 필터링
  const validFiles = files.filter(
    (file) =>
      file.type.startsWith("image/") ||
      file.name.toLowerCase().endsWith(".json") ||
      file.type === "application/json"
  );

  if (validFiles.length === 0) {
    alert("선택한 경로에 이미지나 JSON 파일이 없습니다.");
    imageList = [];
    updateThumbnailList();
    return;
  }

  // 2. 로컬 스토리지 데이터 로드
  const storedData = localStorage.getItem(STORAGE_KEY);
  const history = storedData ? JSON.parse(storedData) : {};

  // 3. 그룹화 로직
  const groupedFiles = {};

  validFiles.forEach((file) => {
    const match = file.name.match(/_(IR|RGB)_/i);
    let identifier = "";
    let type = "OTHER";

    if (match) {
      type = match[1].toUpperCase();
      const parts = file.name.split(match[0]);
      if (parts.length > 1) {
        identifier = parts[1].replace(/\.[^/.]+$/, "");
      }
    } else {
      identifier = file.name;
    }

    if (!groupedFiles[identifier]) {
      groupedFiles[identifier] = {
        IR_IMG: null,
        IR_JSON: null,
        RGB_IMG: null,
        RGB_JSON: null,
        OTHERS: [],
      };
    }

    const isJson = file.name.toLowerCase().endsWith(".json");

    if (type === "IR") {
      if (isJson) groupedFiles[identifier].IR_JSON = file;
      else groupedFiles[identifier].IR_IMG = file;
    } else if (type === "RGB") {
      if (isJson) groupedFiles[identifier].RGB_JSON = file;
      else groupedFiles[identifier].RGB_IMG = file;
    } else {
      groupedFiles[identifier].OTHERS.push(file);
    }
  });

  // 4. 정렬 (파일명 기준 오름차순)
  const sortedKeys = Object.keys(groupedFiles).sort((a, b) => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  // 5. 리스트 생성
  let sortedFileList = [];

  sortedKeys.forEach((key) => {
    const group = groupedFiles[key];

    if (group.RGB_IMG) {
      sortedFileList.push({
        file: group.RGB_IMG,
        jsonFile: group.RGB_JSON,
        jsonFileHandle: group.RGB_JSON ? group.RGB_JSON.handle : null,
        type: "RGB",
      });
    }

    if (group.IR_IMG) {
      sortedFileList.push({
        file: group.IR_IMG,
        jsonFile: group.IR_JSON,
        jsonFileHandle: group.IR_JSON ? group.IR_JSON.handle : null,
        type: "IR",
      });
    }

    group.OTHERS.forEach((file) => {
      if (!file.name.toLowerCase().endsWith(".json")) {
        sortedFileList.push({ file: file, jsonFile: null, type: "OTHER" });
      }
    });
  });

  // 6. 전역 리스트 갱신 및 상태 복원
  imageList = sortedFileList.map((item) => {
    let status = null;

    const itemPath = item.file.webkitRelativePath || item.file.name;
    const folderName = getFolderName(itemPath);

    // 상태 복원 우선순위: 1.파일명(DEL_) -> 2.로컬스토리지 기록
    if (item.file.name.startsWith("DEL_")) {
        status = "deleted";
    } else if (history[folderName] && history[folderName][item.file.name]) {
        status = history[folderName][item.file.name];
    }

    return {
      file: item.file,
      jsonFile: item.jsonFile,
      jsonFileHandle: item.jsonFileHandle,
      name: item.file.name,
      type: item.type,
      path: itemPath,
      status: status,
      dataURL: null,
    };
  });

  // UI 갱신
  updateThumbnailList();

  updateIndexColumnWidth();

  // ============================================================
  // [★핵심] 마지막 작업 위치 찾아 자동 포커싱 로직
  // ============================================================
  if (imageList.length > 0) {
    let targetIndex = 0; // 기본값: 처음(0번)

    // 리스트를 훑으면서 '작업 기록(status)'이 있는 가장 마지막 인덱스를 찾음
    let lastWorkedIndex = -1;
    for (let i = 0; i < imageList.length; i++) {
        if (imageList[i].status) { // saved, deleted, visited 뭐라도 있으면
            lastWorkedIndex = i;
        }
    }

    // 작업 기록이 하나라도 있다면, 그 다음 이미지로 이동
    if (lastWorkedIndex !== -1) {
        targetIndex = lastWorkedIndex;
        console.log(`마지막 작업(${lastWorkedIndex}번) 감지 -> ${targetIndex}번으로 이동합니다.`);
    }

    // 마지막 이미지를 작업했다면 더 이상 갈 곳이 없으므로 마지막에 유지
    if (targetIndex >= imageList.length) {
        targetIndex = imageList.length - 1;
        // (선택사항) alert("모든 작업을 완료했습니다.");
    }

    // 해당 인덱스로 로드
    loadImageFromList(targetIndex);
  }
}

/**
 * [헤더 메타데이터 업데이트 함수]
 * 1~4번 박스에 '#' 접두사(해시태그)를 적용합니다.
 */
function updateHeaderMetadata(data) {
  // 박스 요소 가져오기
  const boxes = [
    document.getElementById("dataBox1"),
    document.getElementById("dataBox2"),
    document.getElementById("dataBox3"),
    document.getElementById("dataBox4"),
  ];

  if (!data) return;

  const wp = data.work_process || {};
  const env = data.environment || {};
  const imgInfo = data.images || {};
  const anno = data.annotations || {};

  // 1. 작업 장소 -> #실내
  if (boxes[0]) {
    const val = wp.work_location;
    const text = METADATA_MAP.location[val] || val;
    // 값이 있을 때만 #을 붙임
    boxes[0].textContent = text ? `#${text}` : "-";
  }

  // 작업 방식 -> #MIG
  if (boxes[1]) {
    const val = wp.work_method;
    const text = METADATA_MAP.method[val] || val;
    boxes[1].textContent = text ? `#${text}` : "-";
  }

  // 진행 단계
  if (boxes[2]) {
    const val = anno.weld_progress;
    boxes[2].textContent = METADATA_MAP.progress[val] || val || "-";
  }

  // 이미지 ID
  if (boxes[3]) {
    const val = imgInfo.image_id;
    boxes[3].textContent = val || "-";
    boxes[3].title = val || "";
  }
}

/**
 * [진행 단계 계산 함수 - 최종 수정]
 * - RGB: 불티 거리/용접부 유무에 따라 단계 계산 및 JSON 업데이트
 * - IR: 절대 계산하지 않음. JSON에 있는 값을 읽어서 보여주기만 함 (Read-Only)
 */
function updateWeldProgress() {
  const box3 = document.getElementById("dataBox3");
  if (!box3) return;

  // 데이터 없으면 초기화
  if (!currentJsonData) {
    box3.textContent = "-";
    return;
  }

  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";

  // ============================================================
  // [1] IR 모드: 무조건 RGB 데이터를 따르므로 계산/수정 금지
  // ============================================================
  if (isIR) {
    const savedProgress = currentJsonData?.annotations?.weld_progress;
    
    // 값이 있으면 매핑된 텍스트 표시, 없으면 '-'
    if (savedProgress) {
      const text = METADATA_MAP.progress[savedProgress] || savedProgress;
      box3.textContent = text;
    } else {
      box3.textContent = "-";
    }
    // [중요] IR에서는 currentJsonData.annotations.weld_progress를 절대 수정하지 않고 종료
    return;
  }

  // ============================================================
  // [2] RGB 모드: 여기서만 진행 단계 계산 및 결정
  // ============================================================
  const hasWeld = labelPoints.length > 0;
  
  // [예외 처리] 용접부가 없으면 계산 불가 -> 0 (미정) 처리
  if (!hasWeld) {
    box3.textContent = "-";
    if (!currentJsonData.annotations) currentJsonData.annotations = {};
    currentJsonData.annotations.weld_progress = 0; 
    return;
  }

  // 정상 계산 로직
  const hasSpatter = spatterData.length > 0;
  let progress = 0;

  if (hasWeld && !hasSpatter) {
    progress = 5; // 소멸단계
  } else if (hasSpatter) {
    const maxDist = Math.max(...spatterData.map((s) => s.distance || 0));
    if (maxDist <= 160) progress = 1;
    else if (maxDist <= 300) progress = 2;
    else if (maxDist <= 400) progress = 3;
    else progress = 4;
  }

  // 데이터 반영 (RGB에서만 JSON 업데이트 수행)
  if (!currentJsonData.annotations) currentJsonData.annotations = {};
  currentJsonData.annotations.weld_progress = progress;

  const text = METADATA_MAP.progress[progress] || "-";
  box3.textContent = text;
}

/**
 * [리스트에서 이미지 불러오기 - 최종 수정]
 * - 기능 1: 이미지 로드 및 뷰어 표시
 * - 기능 2: 처음 보는 이미지면 'visited' 상태를 로컬 스토리지에 저장 (폴더별)
 */
async function loadImageFromList(index) {
  // 1. 모드 정리
  if (typeof exitSpatterMode === "function") {
    exitSpatterMode();
  }

  // 2. 유효성 검사
  if (index < 0 || index >= imageList.length) return;

  // ============================================================
  // [★추가] 방문 표시 및 로컬 스토리지 저장
  // ============================================================
  // 저장(saved)이나 삭제(deleted) 상태가 아닐 때만 'visited' 처리
  if (!imageList[index].status) {
      imageList[index].status = "visited";
      
      // 로컬 스토리지 업데이트 (폴더명 자동 추출)
      updateLocalStatus(imageList[index].path, imageList[index].name, "visited");
      
      // 리스트 UI에 회색 눈 아이콘 즉시 반영
      renderVirtualThumbnails();
  }
  // ============================================================

  const scrollContainer = document.querySelector(".image-scroll-container");
  if (scrollContainer) scrollContainer.classList.add("loading");

  currentImageIndex = index;
  const imageData = imageList[index];

  // [초기화 영역]
  currentJsonData = null;
  labelPoints = [];
  spatterData = [];
  tempSpatterPoints = [];

  sortState = { col: null, order: 0 };
  updateSortIcons();

  const captionEl = document.getElementById("captionText");
  if (captionEl) captionEl.textContent = "데이터 로딩 중...";

  updateSpatterList();

  // IR 모드 클래스 토글
  const isIR = imageData.type === "IR";
  if (isIR) {
    document.body.classList.add("ir-mode-active");
  } else {
    document.body.classList.remove("ir-mode-active");
  }

  // [데이터 로드 영역]
  try {
    let jsonText = "";
    if (imageData.jsonFileHandle) {
      const file = await imageData.jsonFileHandle.getFile();
      jsonText = await file.text();
    } else if (imageData.jsonFile) {
      jsonText = await imageData.jsonFile.text();
    }

    if (jsonText) {
      currentJsonData = JSON.parse(jsonText);
      // ... (로그 생략) ...
      loadJsonAnnotations(currentJsonData);
    } else {
      throw new Error("No JSON linked");
    }
  } catch (err) {
    if (err.message !== "No JSON linked") {
      console.error("JSON 파싱/로드 실패:", err);
      if (captionEl) captionEl.textContent = "JSON 데이터를 읽을 수 없습니다.";
    } else {
      updateHeaderMetadata(null);
    }
    renderLabelPoints();
    updateSpatterList();
  }

  // [이미지 표시 영역]
  if (imageData.dataURL) {
    displayImage(imageData.dataURL, false);
    updateThumbnailActiveState();
  } else {
    const reader = new FileReader();
    reader.onload = function (e) {
      imageData.dataURL = e.target.result;
      displayImage(imageData.dataURL, false);
      updateThumbnailActiveState();
    };
    reader.readAsDataURL(imageData.file);
  }

  // 다음 이미지 프리로드
  if (typeof preloadNextImage === "function") {
      preloadNextImage(index + 1);
  }
  updateDeleteButtonUI();
}

// Scan.js - displayImage 함수 내부 수정

function displayImage(src, shouldResetPoints = true) {
  const container = document.getElementById("imageContainer");
  
  // HTML 구조 생성 (기존과 동일)
  container.innerHTML = `
    <div class="image-scroll-container loading"> <img src="${src}" class="document-image init-fit" id="documentImage" draggable="false">
        <div id="labelOverlay" class="label-overlay"></div>
    </div>
  `;

  currentImage = src;
  currentZoom = 1;

  if (shouldResetPoints) {
    labelPoints = [];
    spatterData = [];
    updateSpatterList();
  } else {
    updateSpatterList();
  }

  const img = document.getElementById("documentImage");
  const scrollContainer = container.querySelector(".image-scroll-container");

  // [★핵심] 이미지가 브라우저 메모리에 완벽히 로드된 후 실행
  img.onload = function () {
    fitImageToViewer();
    setupImagePanning();
    renderLabelPoints();
    img.classList.remove("init-fit");

    // [★추가] 모든 준비가 끝났으니 부드럽게 화면을 밝힘
    // requestAnimationFrame을 써야 브라우저가 화면을 그릴 타이밍을 잡음
    requestAnimationFrame(() => {
        scrollContainer.classList.remove("loading"); 
    });
    
    updateThumbnailActiveState(); // 썸네일 활성화 갱신
  };
}

// Scan.js 맨 아래에 추가

/**
 * [이미지 프리로드 함수]
 * 다음 순서의 이미지를 브라우저 메모리에 미리 읽어둡니다.
 */
function preloadNextImage(nextIndex) {
  if (nextIndex >= imageList.length) return;

  const nextItem = imageList[nextIndex];
  
  // 이미 데이터가 있으면 패스
  if (nextItem.dataURL) return; 

  // 파일 읽기
  const reader = new FileReader();
  reader.onload = function (e) {
    nextItem.dataURL = e.target.result; // 미리 저장해둠
    console.log(`[System] 다음 이미지(${nextIndex}) 프리로드 완료`);
  };
  reader.readAsDataURL(nextItem.file);
}

/**
 * [JSON 데이터 로드 및 초기 설정 - 최종 수정]
 * - 기능 1: isUserModified = false로 초기화하여 로딩 시점과 수정 시점 구분
 * - 기능 2: "매우 낮음" 등급 파란색 표시 적용
 * - 기능 3: updateSpatterList(true) 호출로 캡션 자동 변경 차단 (원본 텍스트 유지)
 */
function loadJsonAnnotations(data) {
  // 1. 상태 플래그 초기화
  isJsonLoading = true;
  isUserModified = false; // [핵심] 새로운 이미지를 로드했으므로 수정 상태 초기화 (원본 유지 모드)

  currentJsonData = data;

  // 데이터 변수 초기화
  labelPoints = [];
  spatterData = [];
  selectedSpatterId = null;
  currentWeldSize = "-";
  currentWeldRange = "-";

  // 필터/정렬 초기화
  filterState = { type: 0 };
  sortState = { col: null, order: 0 };
  updateSortIcons();

  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";

  // 2. 헤더 메타데이터 업데이트
  updateHeaderMetadata(data);

  // 3. 캡션 파싱 (원본 텍스트 그대로 표시 + 등급별 색상 적용)
  const captionEl = document.getElementById("captionText");
  if (captionEl) {
    const rawText = data.image_caption?.text || "캡션 정보가 없습니다.";

    // 데이터 추출 (IR 이미지 우측 상단 표시용)
    const sizeMatch = rawText.match(/용접부의 총 크기는\s*(\d+)px/);
    if (sizeMatch) currentWeldSize = sizeMatch[1];

    const rangeMatch = rawText.match(/200°C\s*이상의\s*범위는\s*(\d+)px/);
    if (rangeMatch) currentWeldRange = rangeMatch[1];

    // 줄바꿈 분리 및 HTML 생성
    const lines = rawText.split("\n");
    let html = "";

    lines.forEach((line, index) => {
      let clickableClass = "";
      let onClickAttr = "";
      let isClickable = false;

      // 클릭 가능한 라인 설정 (IR/RGB 다름)
      if (isIR) {
        if (index >= 1 && index <= 3) isClickable = true;
      } else {
        if (index >= 1 && index <= 4) isClickable = true;
      }

      if (isClickable) {
        clickableClass = "clickable-line";
        onClickAttr = `onclick="handleCaptionClick(${index})"`;
      }

      let content = line;

      // [색상 처리 로직]
      // 1. "매우 낮음"을 임시 토큰으로 변경 (일반 "낮음"과 충돌 방지)
      if (content.includes("매우 낮음")) {
        content = content.replace(/매우\s*낮음/g, "##VERY_LOW##");
      }

      // 2. 나머지 등급 색상 처리
      content = content.replace(
        /낮음/g,
        '<span style="color:#2e7d32; font-weight:bold;">낮음</span>'
      ); // 초록
      content = content.replace(
        /보통/g,
        '<span style="color:#ff8f00; font-weight:bold;">보통</span>'
      ); // 주황
      content = content.replace(
        /높음/g,
        '<span style="color:#d32f2f; font-weight:bold;">높음</span>'
      ); // 빨강

      // 3. "매우 낮음" 복원 (파란색)
      content = content.replace(
        /##VERY_LOW##/g,
        '<span style="color:#2196f3; font-weight:bold;">매우 낮음</span>'
      );

      html += `<div class="${clickableClass}" ${onClickAttr}>${content}</div>`;
    });

    captionEl.innerHTML = html;
  }

  // 4. 환경 정보 업데이트
  const env = data.environment || {};
  const wp = data.work_process || {};

  document.getElementById("envTime").innerHTML = (
    wp.work_datetime || "-"
  ).replace(" ", "<br>");
  document.getElementById("envTemp").textContent =
    env.temperature !== undefined ? `${env.temperature}°C` : "-";
  document.getElementById("envHumid").textContent =
    env.humidity !== undefined ? `${env.humidity}%` : "-";
  document.getElementById("envOxygen").textContent =
    env.oxygen_level !== undefined ? `${env.oxygen_level}%` : "-";
  document.getElementById("envPM").textContent =
    env.pm2_5 !== undefined ? `${env.pm2_5}㎍` : "-";
  document.getElementById("envPress").textContent =
    env.atmospheric_pressure !== undefined
      ? `${env.atmospheric_pressure}hPa`
      : "-";
  document.getElementById("envWind").textContent =
    env.wind_speed !== undefined ? `${env.wind_speed}m/s` : "-";
  document.getElementById("envMinThick").textContent =
    wp.material_min_thickness !== undefined
      ? `${wp.material_min_thickness}mm`
      : "-";
  document.getElementById("envMaxThick").textContent =
    wp.material_max_thickness !== undefined
      ? `${wp.material_max_thickness}mm`
      : "-";
  document.getElementById("envCurrent").textContent =
    wp.input_current !== undefined ? `${wp.input_current}A` : "-";
  document.getElementById("envGasIn1").textContent =
    wp.input_gas_1_pressure !== null && wp.input_gas_1_pressure !== undefined
      ? wp.input_gas_1_pressure
      : "-";
  document.getElementById("envGasIn2").textContent =
    wp.input_gas_2_pressure !== null && wp.input_gas_2_pressure !== undefined
      ? wp.input_gas_2_pressure
      : "-";

  const elGasType1 = document.getElementById("envGasType1");
  if (elGasType1)
    elGasType1.textContent =
      wp.input_gas_type_1 !== null
        ? METADATA_MAP.gas_type[wp.input_gas_type_1] || wp.input_gas_type_1
        : "-";

  const elGasType2 = document.getElementById("envGasType2");
  if (elGasType2)
    elGasType2.textContent =
      wp.input_gas_type_2 !== null
        ? METADATA_MAP.gas_type[wp.input_gas_type_2] || wp.input_gas_type_2
        : "-";

  const envGrid = document.getElementById("envGrid");
  if (envGrid) envGrid.scrollTop = 0;

  // 5. 용접부 데이터 파싱
  if (data.annotations && Array.isArray(data.annotations.weld_zone)) {
    data.annotations.weld_zone.forEach((pt) => {
      labelPoints.push({ normX: pt.x, normY: pt.y });
    });
  }

  // 6. 불티 데이터 파싱
  const geomList = data.spatter_annotations || [];
  const metaList = data.annotations_auto || [];

  if (Array.isArray(geomList)) {
    geomList.forEach((item, index) => {
      if (item.points && Array.isArray(item.points)) {
        const meta = metaList[index] || {};
        spatterData.push({
          id: item.spatter_id,
          points: item.points,
          type: item.spatter_type,
          size: meta.spatter_size,
          distance: meta.spatter_distance,
          temp: meta.spatter_temp,
        });
      }
    });
  }

  // 7. 화면 갱신
  const img = document.getElementById("documentImage");
  if (img && img.complete) {
    renderLabelPoints();
    // [중요] true를 전달하여 캡션 업데이트(텍스트 변경)를 건너뜀 -> 원본 유지
    updateSpatterList(true);
  }

  isJsonLoading = false;
}

/**
 * [캡션 업데이트 함수 - 최종 수정]
 * 1. 테스트용 currentWeldGeoSize 로직 제거
 * 2. 텍스트 띄어쓰기 및 단위(px²) 통일
 * 3. IR weldInfoContainer 텍스트 업데이트 동기화
 */
function updateCaption() {
  if (isJsonLoading) return;

  const captionEl = document.getElementById("captionText");
  const img = document.getElementById("documentImage");
  const weldInfoContainer = document.getElementById("weldInfoContainer");

  if (!captionEl || !img) return;

  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;

  // 1. [데이터 준비]
  if (labelPoints.length > 0 && !isIR) {
    const weldPixels = labelPoints.map((p) => ({
      x: p.normX * nw,
      y: p.normY * nh,
    }));
    currentWeldSize = Math.floor(calculatePolygonArea(weldPixels));
    currentWeldRange = 0;
  }

  // 2. [불티 통계]
  const totalCnt = spatterData.length;
  const abnormalSpatters = spatterData.filter((s) => s.type === 2); // 이상 불티
  const abnormalCnt = abnormalSpatters.length;

  let displayMaxSize = 0;
  let displayMaxDist = 0;
  let displayCoord = "0,0";

  if (totalCnt > 0) {
    if (isIR) {
      // [IR] 이상 불티 중 최대 크기
      if (abnormalCnt > 0) {
        displayMaxSize = Math.max(...abnormalSpatters.map((s) => s.size));
      } else {
        displayMaxSize = 0;
      }
    } else {
      // [RGB] 전체 불티 중 최대 크기/거리
      displayMaxSize = Math.max(...spatterData.map((s) => s.size));
      displayMaxDist = Math.max(...spatterData.map((s) => s.distance));

      const sorted = [...spatterData].sort((a, b) => b.distance - a.distance);
      const t = sorted[0];
      if (t && t.points) {
        const pts = t.points.map((p) => ({ x: p.x * nw, y: p.y * nh }));
        const center = getPolygonCenter(pts);
        displayCoord = `${Math.floor(center.x)},${Math.floor(center.y)}`;
      }
    }
  }

  // [IR 최고 온도]
  const maxTemp =
    totalCnt > 0 && isIR ? Math.max(...spatterData.map((s) => s.temp)) : 0;

  // 3. [텍스트 및 점수 업데이트]
  if (currentJsonData && currentJsonData.image_caption && isUserModified) {
    let text = currentJsonData.image_caption.text;

    if (isIR) {
      // ================= [IR 모드] =================

      // 1. 용접부 정보 (단위 px²로 통일)
      text = text.replace(
        /용접부의\s*총\s*크기는\s*[\d,]+\s*px²?/,
        `용접부의 총 크기는 ${currentWeldSize}px²`
      );
      text = text.replace(
        /200°C\s*이상의\s*범위는\s*[\d,]+\s*px/,
        `200°C 이상의 범위는 ${currentWeldRange}px`
      );

      // 2. 불티 개수
      text = text.replace(/총\s*[\d,]+\s*개의/, `총 ${totalCnt}개의`);
      text = text.replace(
        /이상\s*불티는\s*[\d,]+\s*개/,
        `이상 불티는 ${abnormalCnt}개`
      );

      // 3. 이상 불티 최대 크기
      text = text.replace(
        /최대\s*크기는\s*[\d,]+\s*px²?/,
        `최대크기는 ${displayMaxSize}px²`
      );

      // 4. 최고 온도
      text = text.replace(
        /최고\s*온도는\s*[\d,]+\s*°C/,
        `최고온도는 ${maxTemp}°C`
      );
    } else {
      // ================= [RGB 모드] =================

      text = text.replace(/총\s*[\d,]+\s*개의/, `총 ${totalCnt}개의`);
      text = text.replace(
        /이상\s*불티는\s*[\d,]+\s*개/,
        `이상 불티는 ${abnormalCnt}개`
      );

      // 텍스트 표시용 (이상 불티 기준, 없으면 0)
      let textMaxSize = 0;
      let textMaxDist = 0;
      let textCoord = "0,0";

      if (abnormalCnt > 0) {
        const abnormalSpattersRGB = spatterData.filter((s) => s.type === 2);
        textMaxSize = Math.max(...abnormalSpattersRGB.map((s) => s.size));
        textMaxDist = Math.max(...abnormalSpattersRGB.map((s) => s.distance));

        const sorted = [...abnormalSpattersRGB].sort(
          (a, b) => b.distance - a.distance
        );
        const t = sorted[0];
        if (t && t.points) {
          const pts = t.points.map((p) => ({ x: p.x * nw, y: p.y * nh }));
          const c = getPolygonCenter(pts);
          textCoord = `${Math.floor(c.x)},${Math.floor(c.y)}`;
        }
      }

      text = text.replace(
        /최대\s*비산거리는\s*[\d,]+\s*px/,
        `최대 비산거리는 ${textMaxDist}px`
      );
      text = text.replace(/위치는\s*[0-9,]+\s*px/, `위치는 ${textCoord}px`);
      text = text.replace(
        /최대\s*크기는\s*[\d,]+\s*px²?/,
        `최대 크기는 ${textMaxSize}px²`
      );

      // 화재위험도
      let scoreMaxDist =
        totalCnt > 0 ? Math.max(...spatterData.map((s) => s.distance)) : 0;
      let scoreMaxSize =
        totalCnt > 0 ? Math.max(...spatterData.map((s) => s.size)) : 0;

      let scoreDist =
        scoreMaxDist <= 160
          ? 0
          : scoreMaxDist <= 300
          ? 1
          : scoreMaxDist <= 400
          ? 2
          : 3;
      let scoreCount =
        abnormalCnt === 0
          ? 0
          : abnormalCnt <= 5
          ? 1
          : abnormalCnt <= 15
          ? 2
          : 3;
      let scoreSize =
        scoreMaxSize <= 6
          ? 0
          : scoreMaxSize <= 15
          ? 1
          : scoreMaxSize <= 25
          ? 2
          : 3;

      const totalScore = scoreDist + scoreCount + scoreSize;

      let riskText = "매우 낮음";
      if (totalScore === 0) riskText = "매우 낮음";
      else if (totalScore <= 4) riskText = "낮음";
      else if (totalScore <= 8) riskText = "보통";
      else riskText = "높음";

      text = text.replace(
        /화재위험도는\s*.*입니다/,
        `화재위험도는 ${riskText}입니다`
      );
    }
    currentJsonData.image_caption.text = text;
  }

  // 4. HTML 렌더링
  const finalText = currentJsonData?.image_caption?.text || "";
  const lines = finalText.split("\n");
  let html = "";

  lines.forEach((line, index) => {
    let clickableClass = "";
    let onClickAttr = "";
    let isClickable = false;

    if (isIR) {
      if (index >= 1 && index <= 3) isClickable = true;
    } else {
      if (index >= 1 && index <= 4) isClickable = true;
    }

    if (isClickable) {
      clickableClass = "clickable-line";
      onClickAttr = `onclick="handleCaptionClick(${index})"`;
    }

    let content = line;
    if (content.includes("매우 낮음"))
      content = content.replace(/매우\s*낮음/g, "##VERY_LOW##");
    content = content.replace(
      /낮음/g,
      '<span style="color:#2e7d32; font-weight:bold;">낮음</span>'
    );
    content = content.replace(
      /보통/g,
      '<span style="color:#ff8f00; font-weight:bold;">보통</span>'
    );
    content = content.replace(
      /높음/g,
      '<span style="color:#d32f2f; font-weight:bold;">높음</span>'
    );
    content = content.replace(
      /##VERY_LOW##/g,
      '<span style="color:#2196f3; font-weight:bold;">매우 낮음</span>'
    );

    html += `<div class="${clickableClass}" ${onClickAttr}>${content}</div>`;
  });

  captionEl.innerHTML = html;

  // 5. Weld Info Container 업데이트 (IR 전용) - geoSize 제거됨
  if (weldInfoContainer && isIR) {
    weldInfoContainer.innerHTML = `
        <span class="info-tag blue">크기: ${currentWeldSize}px²</span>
        <span class="info-tag red">200도 이상 범위: ${currentWeldRange}px</span>
      `;
  }
}

/**
 * [캡션 클릭 핸들러]
 * - RGB: 1(이상), 2(거리), 3(위치->거리), 4(크기)
 * - IR:  1(이상), 2(크기), 3(온도)
 */
function handleCaptionClick(lineIndex) {
  // 현재 이미지 타입 확인
  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";

  // 상태 초기화
  filterState = { type: 0 };
  sortState = { col: null, order: 0 };

  // 공통: 2번째 줄(Index 1)은 항상 "이상 불티 개수" -> 이상 필터링
  if (lineIndex === 1) {
    filterState.type = 2; // 이상만 보기
  } else if (isIR) {
    // --- [IR 모드 로직] ---
    // 3번째 줄(Index 2): 최대 크기 -> 이상 필터 + 크기 정렬
    if (lineIndex === 2) {
      filterState.type = 2;
      sortState = { col: "size", order: 2 }; // 내림차순
    }
    // 4번째 줄(Index 3): 최고 온도 -> 이상 필터 + 온도 정렬
    else if (lineIndex === 3) {
      filterState.type = 2;
      sortState = { col: "dist_temp", order: 2 }; // 온도 내림차순
    }
  } else {
    // --- [RGB 모드 로직] ---
    // 3번째 줄(Index 2): 최대 비산 거리 -> 이상 필터 + 거리 정렬
    // 4번째 줄(Index 3): 위치 -> 이상 필터 + 거리 정렬
    if (lineIndex === 2 || lineIndex === 3) {
      filterState.type = 2;
      sortState = { col: "dist_temp", order: 2 }; // 거리 내림차순
    }
    // 5번째 줄(Index 4): 최대 크기 -> 이상 필터 + 크기 정렬
    else if (lineIndex === 4) {
      filterState.type = 2;
      sortState = { col: "size", order: 2 }; // 크기 내림차순
    }
  }

  updateSortIcons();
  updateSpatterList();
  updateCaption();
}

/**
 * [정렬/필터 토글 핸들러]
 */
function toggleSort(column) {
  if (column === "type") {
    // 유형 필터: 0(전체) -> 1(정상) -> 2(이상) -> 0
    filterState.type = (filterState.type + 1) % 3;
    // 필터링 중일 때는 정렬 해제 (원하면 유지 가능)
    sortState = { col: null, order: 0 };
  } else {
    // 크기/거리 정렬
    if (sortState.col !== column) {
      sortState.col = column;
      sortState.order = 1;
    } else {
      sortState.order = (sortState.order + 1) % 3;
    }
    if (sortState.order === 0) sortState.col = null;
  }

  updateSortIcons();
  updateSpatterList();
}

/**
 * [환경 정보 토글 핸들러]
 * 환경 정보 리스트를 펼치거나 접습니다.
 */
function toggleEnvInfo() {
  const grid = document.getElementById("envGrid");
  const header = document.querySelector(".env-section-header");

  if (grid && header) {
    // 그리드 확장/축소 클래스 토글
    grid.classList.toggle("expanded");

    // 헤더 아이콘 회전 클래스 토글
    header.classList.toggle("active");
  }
}

/**
 * [우측 패널 리스트 업데이트 - 버그 수정됨]
 * - 수정사항: 불티가 0개일 때(return 되는 시점)도 updateWeldProgress()를 호출하도록 수정
 */
function updateSpatterList() {
 const container = document.getElementById("spatterListContainer");
  const weldInfoContainer = document.getElementById("weldInfoContainer");
  const deleteWeldBtn = document.querySelector(".btn-delete-weld");
  const headerDistText = document.getElementById("header_dist_temp_text");
  
  // 헤더 컨테이너 선택
  const headerContainer = document.querySelector(".filter-header");
  
  // [★수정됨] 기존 getElementById("header_coord")는 HTML에 ID가 없어서 못 찾음
  // 클래스(.col-coord)로 찾도록 변경
  const headerCoord = document.querySelector(".filter-header .col-coord");

  if (!container) return;

  const currentImgData = imageList[currentImageIndex];
  if (!currentImgData) {
    container.innerHTML = "";
    if (weldInfoContainer) weldInfoContainer.style.display = "none";
    if (deleteWeldBtn) deleteWeldBtn.style.display = "none";
    if (headerDistText) headerDistText.textContent = "거리/온도";
    return;
  }

  const isIR = currentImgData.type === "IR";
  const img = document.getElementById("documentImage");

  // 1. IR 모드 설정
  if (isIR) {
    if (headerContainer) headerContainer.classList.add("ir-mode");
    container.classList.add("ir-mode");
  } else {
    if (headerContainer) headerContainer.classList.remove("ir-mode");
    container.classList.remove("ir-mode");
  }

  // 2. 헤더 텍스트
  if (headerDistText) headerDistText.textContent = isIR ? "온도" : "거리";
  if (headerCoord) headerCoord.style.display = isIR ? "none" : "";

  // 3. 용접부 정보 (IR 전용)
  if (weldInfoContainer) {
    if (deleteWeldBtn) {
      deleteWeldBtn.style.display = "flex";
      deleteWeldBtn.onclick = deleteWeldZone;
    }

    if (isIR) {
      weldInfoContainer.style.display = "flex";
      weldInfoContainer.innerHTML = `
        <span class="info-tag blue">크기: ${currentWeldSize}px</span>
        <span class="info-tag red">200도 이상 범위: ${currentWeldRange}px</span>
      `;
    } else {
      weldInfoContainer.style.display = "none";
    }
  }

  // 4. 불티 통계 업데이트
  const elTotal = document.getElementById("cntTotal");
  const elNormal = document.getElementById("cntNormal");
  const elAbnormal = document.getElementById("cntAbnormal");
  if (elTotal) {
    elTotal.textContent = spatterData.length;
    elNormal.textContent = spatterData.filter((item) => item.type === 1).length;
    elAbnormal.textContent = spatterData.filter(
      (item) => item.type === 2
    ).length;
  }

  // 5. 데이터 필터링 및 정렬
  let displayList = [...spatterData];
  if (filterState.type !== 0)
    displayList = displayList.filter((item) => item.type === filterState.type);

  if (sortState.col && sortState.order !== 0) {
    displayList.sort((a, b) => {
      let valA, valB;
      switch (sortState.col) {
        case "size":
          valA = a.size || 0;
          valB = b.size || 0;
          break;
        case "dist_temp":
          if (isIR) {
            valA = a.temp || 0;
            valB = b.temp || 0;
          } else {
            valA = a.distance || 0;
            valB = b.distance || 0;
          }
          break;
        case "type":
          valA = a.type || 0;
          valB = b.type || 0;
          break;
        default:
          return 0;
      }
      return sortState.order === 1 ? valA - valB : valB - valA;
    });
  } else {
    displayList.sort((a, b) => a.id - b.id);
  }

  updateSortIcons();

  // 6. 리스트 렌더링
  if (displayList.length === 0) {
    let msg = "데이터가 없습니다.";
    if (filterState.type === 1) msg = "정상 불티가 없습니다.";
    if (filterState.type === 2) msg = "이상 불티가 없습니다.";
    container.innerHTML = `<div style="padding:20px; text-align:center; color:#999; font-size:13px;">${msg}</div>`;

    updateCaption();

    // [★ 핵심 수정] 데이터가 0개여서 리턴하기 전에도 진행 단계를 업데이트해야 함 (소멸단계 체크용)
    if (typeof updateWeldProgress === "function") updateWeldProgress();

    return;
  }

  let html = "";
  displayList.forEach((spatter) => {
    const originalIndex = spatterData.findIndex(
      (item) => item.id === spatter.id
    );
    let rowClass = "spatter-item";
    if (spatter.id === selectedSpatterId) rowClass += " selected";

    const sizeVal = spatter.size !== undefined ? `${spatter.size}px²` : "-";
    let typeText = "-",
      typeClass = "type-none";
    if (spatter.type === 1) {
      typeText = "정상";
      typeClass = "type-normal";
    } else if (spatter.type === 2) {
      typeText = "이상";
      typeClass = "type-abnormal";
    }

    let distTempStr = "-";
    if (isIR) {
      const tempVal = spatter.temp !== undefined ? `${spatter.temp}°C` : "-";
      distTempStr = `<span style="color:#d32f2f;">${tempVal}</span>`;
    } else {
      const distVal =
        spatter.distance !== undefined ? `${spatter.distance}px` : "-";
      distTempStr = distVal;
    }

    let coordColHtml = "";
    if (!isIR) {
      let coordText = "-";
      if (spatter.type === 2 && img && img.naturalWidth && spatter.points) {
        let sumX = 0,
          sumY = 0;
        spatter.points.forEach((p) => {
          sumX += p.x;
          sumY += p.y;
        });
        const pxX = Math.floor(
          (sumX / spatter.points.length) * img.naturalWidth
        );
        const pxY = Math.floor(
          (sumY / spatter.points.length) * img.naturalHeight
        );
        coordText = `(${pxX}, ${pxY})`;
      }
      coordColHtml = `<div class="col-coord">${coordText}</div>`;
    }

    html += `
      <div class="${rowClass}" id="list-item-${spatter.id}" onclick="highlightSpatter(${originalIndex})">
        <div class="spatter-row-content">
          <div class="col-id">#${spatter.id}</div>
          <div class="col-size">${sizeVal}</div>
          <div class="col-dist">${distTempStr}</div>
          ${coordColHtml}
          <div class="col-type ${typeClass}">${typeText}</div>
          <div class="col-del">
            <button class="btn-delete-item" onclick="deleteSpatter(event, ${originalIndex})">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  updateCaption();

  // [기존] 불티가 있을 때 진행 단계 업데이트
  if (typeof updateWeldProgress === "function") updateWeldProgress();
}

/**
 * [불티 개별 삭제 핸들러 - 수정됨]
 * - 수정사항: 삭제 후 updateCaption() 호출
 */
function deleteSpatter(e, index) {
  // 이벤트 전파 방지
  e.stopPropagation();

  // 모드 종료 (안전장치)
  if (typeof exitSpatterMode === "function") exitSpatterMode();

  // 1. 선택 상태 해제 로직
  if (spatterData[index] && spatterData[index].id === selectedSpatterId) {
    selectedSpatterId = null;
  }

  // 2. 데이터 삭제
  spatterData.splice(index, 1);

  // -----------------------------------------------------------
  // [★핵심] ID 재정렬 (Renumbering)
  // 중간이 비지 않도록 남은 데이터들에 대해 1번부터 번호를 다시 부여합니다.
  // -----------------------------------------------------------
  spatterData.forEach((item, newIndex) => {
      item.id = newIndex + 1;
  });

  isUserModified = true; // [중요] 수정 상태로 변경

  // 3. 화면 및 리스트 갱신
  renderLabelPoints();
  updateSpatterList();

  // 4. [★핵심] 캡션 텍스트 재계산
  // 불티 개수가 줄어들거나 최대 거리/크기가 바뀔 수 있으므로 반드시 호출
  updateCaption();
}

/**
 * [불티 전체 삭제 함수]
 * - 수정됨: 삭제 시 필터 및 정렬을 초기화하여 '전체 보기' 상태로 만듦
 */
function deleteAllSpatters() {
  if (spatterData.length === 0) {
    alert("삭제할 불티 데이터가 없습니다.");
    return;
  }

  if (confirm("모든 불티 데이터를 삭제하시겠습니까?")) {
    if (typeof exitSpatterMode === "function") exitSpatterMode();

    // 1. 데이터 초기화
    isUserModified = true;
    spatterData = [];
    selectedSpatterId = null;

    // ============================================================
    // [★추가] 여기에만 필터 초기화 코드를 넣습니다.
    // ============================================================
    filterState = { type: 0 };           // 필터 해제
    sortState = { col: null, order: 0 }; // 정렬 해제
    updateSortIcons();                   // 아이콘 UI 초기화
    // ============================================================

    // 2. 화면 갱신
    renderLabelPoints();
    updateSpatterList();
    updateCaption();
    
    console.log("불티 전체 삭제 완료 (필터 초기화됨)");
  }
}

/**
 * [용접부 전체 삭제 함수 - 수정됨]
 * 1. 용접부 데이터 초기화 (labelPoints = [])
 * 2. 관련 수치(크기, 범위) 0으로 재계산 (recalculateWeldZone)
 * 3. 용접부 기준으로 계산되던 불티 거리 재계산 (recalculateSingleSpatter)
 * 4. 캡션 및 UI 즉시 갱신
 */
function deleteWeldZone() {
  if (labelPoints.length === 0) {
    alert("삭제할 용접부 데이터가 없습니다.");
    return;
  }

  if (confirm("용접부 영역을 삭제하시겠습니까?")) {
    isUserModified = true;

    // 1. 포인트 데이터 삭제
    labelPoints = [];

    // 2. [핵심] 전역 변수(currentWeldSize, currentWeldRange)를 0으로 리셋
    // recalculateWeldZone 함수 내부에 "점 개수가 적으면 0으로 설정"하는 로직이 있으므로 이를 활용
    recalculateWeldZone();

    // 3. 용접부가 사라졌으므로, 용접부 중심을 기준으로 하던 불티 거리 재계산 (RGB 모드 등 영향)
    if (spatterData.length > 0) {
      // 모든 불티 재계산
      for (let i = 0; i < spatterData.length; i++) {
        recalculateSingleSpatter(i);
      }
    }

    // 4. 화면 및 UI 갱신
    renderLabelPoints(); // 이미지 위 초록색 선 제거
    updateSpatterList(); // 우측 패널 정보창(WeldInfo) 갱신/숨김
    updateCaption(); // 캡션 텍스트 갱신 (0px, 0px로 변경됨)

    console.log("용접부 삭제 완료: 캡션 및 데이터 초기화됨");
  }
}

/**
 * [용접부 추가 핸들러 - 최종 수정]
 * - 용접부 생성 즉시 모든 불티의 거리/유형을 재계산하여 UI 및 캡션에 반영
 */
function handleWeldAddClick(e) {
  if (isPanning || !isAddingWeld) return;

  const img = document.getElementById("documentImage");
  if (!img) return;

  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";

  // 중복 방지
  if (isIR && labelPoints.length === 4) {
    alert("용접부 영역은 1개만 존재할 수 있습니다.");
    isAddingWeld = false;
    resetWeldModeUI();
    return;
  }
  if (!isIR && labelPoints.length > 0) {
    alert("용접부 영역은 1개만 존재할 수 있습니다.");
    isAddingWeld = false;
    resetWeldModeUI();
    return;
  }

  const rect = img.getBoundingClientRect();
  if (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  )
    return;

  // [IR 모드: 점 4개 찍기]
  if (isIR) {
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    labelPoints.push({ normX, normY });

    // 4포인트 완성 시 (생성 완료)
    if (labelPoints.length === 4) {
      isAddingWeld = false;
      isUserModified = true; 

      // 1. 용접부 자체 데이터(크기, 온도범위) 계산
      recalculateWeldZone(); 

      // ============================================================
      // [★추가됨] 용접부가 생겼으니, 기존 불티들의 거리/유형을 재계산
      // ============================================================
      if (spatterData.length > 0) {
        for (let i = 0; i < spatterData.length; i++) {
            recalculateSingleSpatter(i);
        }
      }

      // 2. UI 및 캡션 갱신
      resetWeldModeUI();
      updateSpatterList();
      updateCaption(); 
    }
  }
  // [RGB 모드: 클릭 한 번으로 사각형 생성]
  else {
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    const halfW = 199 / 2;
    const halfH = 196 / 2;

    labelPoints = [
      {
        normX: (clickX - halfW) / img.naturalWidth,
        normY: (clickY - halfH) / img.naturalHeight,
      },
      {
        normX: (clickX + halfW) / img.naturalWidth,
        normY: (clickY - halfH) / img.naturalHeight,
      },
      {
        normX: (clickX + halfW) / img.naturalWidth,
        normY: (clickY + halfH) / img.naturalHeight,
      },
      {
        normX: (clickX - halfW) / img.naturalWidth,
        normY: (clickY + halfH) / img.naturalHeight,
      },
    ];

    isAddingWeld = false;
    isUserModified = true;

    // 1. 용접부 자체 데이터 계산
    recalculateWeldZone();

    // ============================================================
    // [★추가됨] 용접부가 생겼으니, 기존 불티들의 거리/유형을 재계산
    // ============================================================
    if (spatterData.length > 0) {
        for (let i = 0; i < spatterData.length; i++) {
            recalculateSingleSpatter(i);
        }
    }

    // 2. UI 및 캡션 갱신
    resetWeldModeUI();
    updateSpatterList();
    updateCaption();
  }
  renderLabelPoints();
}

/**
 * [헬퍼] 용접부 추가 모드 종료 시 UI 정리
 */
function resetWeldModeUI() {
  const scrollContainer = document.querySelector(".image-scroll-container");
  const btn = document.querySelector(".side-tab-btn.weld");

  if (scrollContainer) {
    scrollContainer.classList.remove("labeling-mode");
    scrollContainer.removeEventListener("click", handleWeldAddClick);
  }
  if (btn) {
    btn.classList.remove("active-mode");
  }
}

/**
 * [수정됨] RGB 값을 입력받아 매핑 테이블에서 '가장 비슷한 색상'의 온도를 반환
 * - 유클리드 거리(Euclidean Distance)를 사용하여 색상 차이가 가장 적은 항목을 찾음
 */
function getTemperatureFromRGB(r, g, b) {
  let minDist = Infinity;
  let matchedTemp = 50; // 기본값 (흰색/배경)

  // 검정색(0,0,0)이나 매우 어두운 색은 데이터 없음으로 간주 (50도 처리)
  if (r < 10 && g < 10 && b < 10) return 50;

  for (const item of TEMP_MAP1) {
    // 3차원 색공간에서의 거리 계산 (피타고라스 정리)
    const dist = Math.sqrt(
      Math.pow(item.r - r, 2) +
        Math.pow(item.g - g, 2) +
        Math.pow(item.b - b, 2)
    );

    if (dist < minDist) {
      minDist = dist;
      matchedTemp = item.temp;
    }
  }

  return matchedTemp;
}

/**
 * [불티 포인트 이동 시작]
 */
function handleSpatterPointDragStart(e, spatterIdx, pointIdx) {
  e.stopPropagation();
  e.preventDefault();

  exitSpatterMode();

  isDraggingSpatterPoint = true;
  draggingSpatterIndex = spatterIdx;
  draggingPointIndex = pointIdx;

  highlightSpatter(spatterIdx, false);

  // [수정] 클릭된 특정 포인트에만 식별용 클래스 추가
  e.target.classList.add("point-dragging");

  document.body.classList.add("dragging-spatter-point");

  document.addEventListener("mousemove", handleSpatterPointDragMove);
  document.addEventListener("mouseup", handleSpatterPointDragEnd);
}

/**
 * [불티 포인트 이동 중]
 */
function handleSpatterPointDragMove(e) {
  if (!isDraggingSpatterPoint) return;

  const img = document.getElementById("documentImage");
  if (!img) return;

  const rect = img.getBoundingClientRect();

  // 마우스 위치를 이미지 내부 좌표(0~1)로 변환
  // 범위 제한 (0보다 작거나 1보다 크지 않게)
  let normX = (e.clientX - rect.left) / rect.width;
  let normY = (e.clientY - rect.top) / rect.height;

  // (선택사항) 이미지 밖으로 나가지 않게 제한
  normX = Math.max(0, Math.min(1, normX));
  normY = Math.max(0, Math.min(1, normY));

  // 데이터 업데이트
  if (
    spatterData[draggingSpatterIndex] &&
    spatterData[draggingSpatterIndex].points
  ) {
    spatterData[draggingSpatterIndex].points[draggingPointIndex] = {
      x: normX,
      y: normY,
    };
    renderLabelPoints(); // 화면 갱신 (실시간 변형)
  }
}

/*
 * [불티 포인트 이동 종료 핸들러 - 수정됨]
 * - 이동이 끝난 후 해당 불티의 데이터를 재계산하고 리스트 갱신
 */
function handleSpatterPointDragEnd() {
  // [추가] 드래그가 끝났으므로 해당 불티(#draggingSpatterIndex) 정보 재계산
  if (draggingSpatterIndex !== -1) {
    recalculateSingleSpatter(draggingSpatterIndex);
  }

  isDraggingSpatterPoint = false;
  draggingSpatterIndex = -1;
  draggingPointIndex = -1;

  // 드래그 상태 클래스 제거
  const draggingPoint = document.querySelector(".spatter-point.point-dragging");
  if (draggingPoint) {
    draggingPoint.classList.remove("point-dragging");
  }

  document.body.classList.remove("dragging-spatter-point");
  document.removeEventListener("mousemove", handleSpatterPointDragMove);
  document.removeEventListener("mouseup", handleSpatterPointDragEnd);

  // [중요] 리스트 UI 갱신 (바뀐 크기, 거리, 유형 반영)
  updateSpatterList();
}

/**
 * [용접부 이동 시작]
 */
function handleWeldDragStart(e) {
  e.stopPropagation(); // 배경 패닝 방지
  e.preventDefault(); // 텍스트 선택 방지

  exitSpatterMode();

  isDraggingWeldZone = true;
  isUserModified = true;
  weldDragStartPos = { x: e.clientX, y: e.clientY };

  document.body.classList.add("dragging-weld");

  // 드래그 중 움직임과 놓기 이벤트는 document 전체에 걸어야 자연스러움
  document.addEventListener("mousemove", handleWeldDragMove);
  document.addEventListener("mouseup", handleWeldDragEnd);
}

/**
 * [용접부 이동 중]
 * 마우스 이동 거리만큼 폴리곤의 모든 점 좌표를 업데이트
 */
function handleWeldDragMove(e) {
  if (!isDraggingWeldZone) return;

  const img = document.getElementById("documentImage");
  if (!img) return;

  // 1. 이동 거리 계산 (픽셀 단위)
  const dx = e.clientX - weldDragStartPos.x;
  const dy = e.clientY - weldDragStartPos.y;

  // 2. 현재 이미지의 렌더링 된 크기 가져오기
  // (zoom이 적용된 상태의 실제 크기가 필요함)
  const rect = img.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  // 3. 이동 거리를 정규화 좌표(0~1)로 변환
  const normDx = dx / rect.width;
  const normDy = dy / rect.height;

  // 4. 모든 용접부 포인트 이동
  labelPoints.forEach((p) => {
    p.normX += normDx;
    p.normY += normDy;
  });

  // 5. 기준점 업데이트 및 화면 다시 그리기
  weldDragStartPos = { x: e.clientX, y: e.clientY };
  renderLabelPoints();
}

/**
 * [용접부 이동 종료 핸들러 - 수정됨]
 * 1. 용접부 데이터(IR 픽셀 분석) 재계산 추가 (recalculateWeldZone)
 * 2. 모든 불티 거리/온도 재계산
 * 3. 리스트 및 캡션 UI 즉시 갱신
 */
function handleWeldDragEnd() {
  isDraggingWeldZone = false;

  document.body.classList.remove("dragging-weld");
  document.removeEventListener("mousemove", handleWeldDragMove);
  document.removeEventListener("mouseup", handleWeldDragEnd);

  // 1. [핵심 추가] 이동한 위치에서 용접부 데이터(크기, 범위) 다시 계산
  // 이 함수가 실행되어야 currentWeldSize, currentWeldRange 변수가 업데이트됨
  recalculateWeldZone();

  // 2. 모든 불티에 대해 거리/유형 재계산 (용접부 위치가 변했으므로)
  if (spatterData.length > 0) {
    console.log("용접부 이동 완료: 모든 불티 재계산 시작");
    for (let i = 0; i < spatterData.length; i++) {
      recalculateSingleSpatter(i);
    }
  }

  // 3. UI 갱신
  // updateSpatterList: 우측 상단 weldInfoContainer(크기, 범위 텍스트) 갱신
  updateSpatterList();

  // updateCaption: 이미지 캡션 텍스트 갱신
  updateCaption();
}

/**
 * [헬퍼] 픽셀(점)이 다각형 내부에 있는지 판별 (Ray-casting algorithm)
 */
function isPointInPolygon(x, y, vs) {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x,
      yi = vs[i].y;
    const xj = vs[j].x,
      yj = vs[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * [헬퍼] RGB 값과 가장 가까운 TEMP_MAP 색상을 찾아 온도 반환
 */
function getClosestTemp(r, g, b) {
  let minDist = Infinity;
  let matchedTemp = 0;

  for (const item of TEMP_MAP1) {
    const dist = Math.sqrt(
      Math.pow(item.r - r, 2) +
        Math.pow(item.g - g, 2) +
        Math.pow(item.b - b, 2)
    );

    if (dist < minDist) {
      minDist = dist;
      matchedTemp = item.temp;
    }
  }
  return matchedTemp;
}

/**
 * [용접부 영역 분석 함수 - 최종]
 * - IR: currentWeldSize = 열이 감지된 유효 픽셀 수 (흰색 배경 제외)
 * - IR: currentWeldRange = 200도 이상 픽셀 수
 */
function recalculateWeldZone() {
  if (labelPoints.length < 3) {
    currentWeldSize = 0;
    currentWeldRange = 0;
    return;
  }

  const img = document.getElementById("documentImage");
  if (!img) return;

  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;

  // 픽셀 좌표 변환
  const weldPixels = labelPoints.map((p) => ({
    x: p.normX * nw,
    y: p.normY * nh,
  }));

  if (isIR) {
    // --- [IR 모드] 픽셀 정밀 분석 ---
    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, nw, nh);

    const xs = weldPixels.map((p) => p.x);
    const ys = weldPixels.map((p) => p.y);
    const minX = Math.floor(Math.max(0, Math.min(...xs)));
    const minY = Math.floor(Math.max(0, Math.min(...ys)));
    const maxX = Math.ceil(Math.min(nw, Math.max(...xs)));
    const maxY = Math.ceil(Math.min(nh, Math.max(...ys)));
    const w = maxX - minX;
    const h = maxY - minY;

    let validPixelCount = 0; // 열 감지 픽셀 (크기)
    let highTempCount = 0; // 200도 이상 (범위)

    if (w > 0 && h > 0) {
      const imgData = ctx.getImageData(minX, minY, w, h);
      const data = imgData.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const absX = minX + x;
          const absY = minY + y;

          if (isPointInPolygon(absX, absY, weldPixels)) {
            const i = (y * w + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 1. 배경(흰색) 필터링 - 열 없음 간주
            if (r > 220 && g > 220 && b > 220) continue;
            if (r < 30 && g < 30 && b < 30) continue;

            // 2. 유효 픽셀 카운트 (이것이 '크기'가 됨)
            validPixelCount++;

            // 3. 온도 확인 (200도 이상)
            const temp = getClosestTemp(r, g, b);
            if (temp >= 200) {
              highTempCount++;
            }
          }
        }
      }
    }

    // [결과 저장]
    currentWeldSize = validPixelCount;
    currentWeldRange = highTempCount;

    console.log(
      `[용접부 분석] 열 감지 크기: ${currentWeldSize}px, 200도↑ 범위: ${currentWeldRange}px`
    );
  } else {
    // --- [RGB 모드] 단순 면적 ---
    currentWeldSize = Math.floor(calculatePolygonArea(weldPixels));
    currentWeldRange = 0;
  }
}

/**
 * [단일 불티 재계산 함수 - 디버깅 모드]
 * - 기능: IR 모드에서 어떤 RGB 픽셀이 '유효'하다고 판단되는지 콘솔에 출력
 */
function recalculateSingleSpatter(index) {
  // 1. 함수 진입 로그 (콘솔 확인용)
  console.log(`⚡ [재계산 진입] 인덱스: ${index}`);

  const spatter = spatterData[index];
  if (!spatter) {
    console.error("❌ 불티 데이터 없음");
    return;
  }

  const img = document.getElementById("documentImage");
  if (!img) return;

  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;

  // 픽셀 좌표 변환
  const spatterPixels = spatter.points.map((p) => ({
    x: p.x * nw,
    y: p.y * nh,
  }));

  if (isIR) {
    console.log("📷 IR 모드: 픽셀 분석 시작");

    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, nw, nh);

    const xs = spatterPixels.map((p) => p.x);
    const ys = spatterPixels.map((p) => p.y);
    const minX = Math.floor(Math.max(0, Math.min(...xs)));
    const minY = Math.floor(Math.max(0, Math.min(...ys)));
    const maxX = Math.ceil(Math.min(nw, Math.max(...xs)));
    const maxY = Math.ceil(Math.min(nh, Math.max(...ys)));

    const w = maxX - minX;
    const h = maxY - minY;

    let validPixelCount = 0;
    let maxTempFound = 0;
    let debugCount = 0; // 로그 도배 방지

    if (w > 0 && h > 0) {
      const imgData = ctx.getImageData(minX, minY, w, h);
      const data = imgData.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const absX = minX + x;
          const absY = minY + y;

          if (isPointInPolygon(absX, absY, spatterPixels)) {
            const i = (y * w + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // [배경 필터링]
            // 흰색 배경 (RGB 모두 200 이상) -> 무시
            const isWhite = r > 200 && g > 200 && b > 200;
            // 검정 배경 (RGB 모두 10 미만) -> 무시
            const isBlack = r < 10 && g < 10 && b < 10;

            if (!isWhite && !isBlack) {
              validPixelCount++;
              const temp = getClosestTemp(r, g, b);

              if (temp > maxTempFound) maxTempFound = temp;

              // [디버깅] 유효 픽셀 5개만 로그 출력
              if (debugCount < 5) {
                console.log(
                  `🎨 유효 픽셀(${absX},${absY}): R${r} G${g} B${b} -> ${temp}°C`
                );
                debugCount++;
              }
            }
          }
        }
      }
    }

    console.log(
      `📊 분석 결과: 크기 ${validPixelCount}px, 온도 ${maxTempFound}°C`
    );

    spatter.size = validPixelCount;
    spatter.temp = maxTempFound;
    spatter.type = maxTempFound >= 200 ? 2 : 1;
    spatter.distance = 0;
  } else {
    // ------------------------------------------------
    // [RGB 모드] (기존 유지)
    // ------------------------------------------------
    spatter.size = Math.floor(calculatePolygonArea(spatterPixels));

    let newDist = 0;
    if (labelPoints.length > 0) {
      const weldPixels = labelPoints.map((p) => ({
        x: p.normX * nw,
        y: p.normY * nh,
      }));
      const spatterCenter = getPolygonCenter(spatterPixels);
      const weldCenter = getPolygonCenter(weldPixels);
      newDist = Math.floor(getDistance(spatterCenter, weldCenter));
    }
    spatter.distance = newDist;
    spatter.type = newDist >= 400 ? 2 : 1;
  }
}

/**
 * [정렬/필터 아이콘 UI 업데이트]
 */
function updateSortIcons() {
  const icons = {
    size: document.getElementById("sortIcon_size"),
    dist_temp: document.getElementById("sortIcon_dist_temp"),
    type: document.getElementById("sortIcon_type"),
  };

  for (let key in icons) {
    if (icons[key]) {
      icons[key].textContent = "▼";
      icons[key].style.opacity = "0.2";
      icons[key].style.fontSize = "10px";
      icons[key].style.fontWeight = "normal";
      icons[key].style.color = ""; // 색상 초기화
    }
  }

  // 1. 정렬 아이콘 (크기, 거리)
  if (sortState.col && icons[sortState.col]) {
    const icon = icons[sortState.col];
    icon.style.opacity = "1";
    icon.style.color = "#333";
    icon.textContent = sortState.order === 1 ? "▲" : "▼";
  }

  // 2. 필터 아이콘 (유형)
  if (filterState.type !== 0 && icons.type) {
    const icon = icons.type;
    icon.style.opacity = "1";
    icon.style.fontSize = "11px";
    icon.style.fontWeight = "bold";

    if (filterState.type === 1) {
      icon.textContent = " [정상]";
      icon.style.color = "#ffaa00";
    } else if (filterState.type === 2) {
      icon.textContent = " [이상]";
      icon.style.color = "#d32f2f";
    }
  }
}

/**
 * [이미지 뷰어 크기 맞춤 - 수정됨]
 * - RGB: 기존대로 뷰어보다 크면 축소하고, 작으면 원본 크기 유지 (최대 1배)
 * - IR: 해상도가 낮으므로 뷰어 크기에 맞춰서 '확대' (1배 이상 허용)
 */
function fitImageToViewer() {
  const img = document.getElementById("documentImage");
  const scrollContainer = document.querySelector(".image-scroll-container");

  if (!img || !scrollContainer) return;

  // 컨테이너(뷰어) 크기
  const containerWidth = scrollContainer.clientWidth;
  const containerHeight = scrollContainer.clientHeight;

  if (containerWidth === 0 || containerHeight === 0) return;

  // 현재 이미지 타입 확인
  const currentImgData = imageList[currentImageIndex];
  const isIR = currentImgData && currentImgData.type === "IR";

  // 가로/세로 비율 중 더 작게 축소(또는 확대)해야 하는 쪽을 기준
  const scaleX = containerWidth / img.naturalWidth;
  const scaleY = containerHeight / img.naturalHeight;

  if (isIR) {
    // [IR 수정] 작은 이미지도 화면에 꽉 차게 '확대' 허용
    // 1.0 제한을 없애서 뷰어 크기에 맞춥니다.
    currentZoom = Math.min(scaleX, scaleY);
  } else {
    // [RGB 유지] 원본보다 커지지 않게 제한 (기존 로직)
    // Math.min(..., 1)이 있어 원본 해상도 이상으로 늘어나지 않습니다.
    currentZoom = Math.min(scaleX, scaleY, 1);
  }

  zoomOriginX = 0.5;
  zoomOriginY = 0.5;

  updateImageTransform();

  // 중앙 정렬을 위해 스크롤 초기화
  scrollContainer.scrollLeft = 0;
  scrollContainer.scrollTop = 0;
}

/**
 * [이미지 변환 및 UI 스케일링 적용 - 수정됨]
 * - 수정사항: 줌 확대 시 상하좌우 끝부분이 잘리지 않도록 스크롤 영역(margin/padding) 계산 로직 개선
 */
function updateImageTransform() {
  const img = document.getElementById("documentImage");
  const scrollContainer = document.querySelector(".image-scroll-container");
  const overlay = document.getElementById("labelOverlay");

  if (!img || !scrollContainer) return;

  // 1. 확대된 이미지 크기 계산
  const scaledWidth = Math.round(img.naturalWidth * currentZoom);
  const scaledHeight = Math.round(img.naturalHeight * currentZoom);

  img.style.width = scaledWidth + "px";
  img.style.height = scaledHeight + "px";

  // --- [UI 스케일 계산] ---
  if (overlay) {
    let uiScale = Math.sqrt(currentZoom);
    uiScale = Math.max(0.5, uiScale);
    overlay.style.setProperty("--ui-scale", uiScale);
  }

  // 2. 뷰어 크기 가져오기
  const viewerW = scrollContainer.clientWidth;
  const viewerH = scrollContainer.clientHeight;

  // 3. 중앙 정렬 및 스크롤 영역 계산 로직 수정
  // 이미지가 뷰어보다 작을 때는 중앙 정렬 (margin: auto 효과)
  // 이미지가 뷰어보다 클 때는 0부터 시작 (잘림 방지)

  if (scaledWidth > viewerW || scaledHeight > viewerH) {
    scrollContainer.style.overflow = "auto"; // 스크롤바 활성화

    // [핵심 수정] absolute 대신 flex 또는 margin을 활용하여 스크롤 영역 확보
    // 기존 left/top 강제 지정 방식은 스크롤 영역을 제한할 수 있음

    img.style.position = "absolute";

    // 이미지가 뷰어보다 클 경우: 왼쪽 상단(0,0)에 딱 붙여서 스크롤 가능하게 함
    // 이미지가 뷰어보다 작을 경우: 중앙에 오도록 함

    const left = scaledWidth > viewerW ? 0 : (viewerW - scaledWidth) / 2;
    const top = scaledHeight > viewerH ? 0 : (viewerH - scaledHeight) / 2;

    img.style.left = left + "px";
    img.style.top = top + "px";

    // [중요] 스크롤 컨테이너가 이미지의 전체 크기를 인식하도록 가짜 공간 확보가 필요할 수 있음
    // 하지만 absolute 포지션일 때 부모의 scrollHeight는 자식의 bottom 위치를 따라감.
    // 따라서 top/left가 0일 때 자연스럽게 해결됨.
  } else {
    // 줌 아웃 상태 (뷰어보다 이미지가 작음) -> 중앙 정렬
    scrollContainer.style.overflow = "hidden";

    img.style.position = "absolute";
    img.style.left = (viewerW - scaledWidth) / 2 + "px";
    img.style.top = (viewerH - scaledHeight) / 2 + "px";

    // 줌 아웃 시 스크롤 위치 초기화
    scrollContainer.scrollLeft = 0;
    scrollContainer.scrollTop = 0;

    zoomOriginX = 0.5;
    zoomOriginY = 0.5;
  }

  // 라벨 오버레이 위치/크기 동기화 (이미지 따라가기)
  renderLabelPoints();
}

function zoomImage(deltaY, clientX, clientY) {
  if (!currentImage) return;
  const scrollContainer = document.querySelector(".image-scroll-container");
  const img = document.getElementById("documentImage");
  if (!img || !scrollContainer) return;

  const containerRect = scrollContainer.getBoundingClientRect();

  if (typeof clientX === "undefined" || typeof clientY === "undefined") {
    clientX = containerRect.left + containerRect.width / 2;
    clientY = containerRect.top + containerRect.height / 2;
  }

  const mouseX = clientX - containerRect.left;
  const mouseY = clientY - containerRect.top;
  const scrollAdjustedMouseX = mouseX + scrollContainer.scrollLeft;
  const scrollAdjustedMouseY = mouseY + scrollContainer.scrollTop;

  const imgRect = img.getBoundingClientRect();
  const imgLeft =
    imgRect.left - containerRect.left + scrollContainer.scrollLeft;
  const imgTop = imgRect.top - containerRect.top + scrollContainer.scrollTop;

  const currentWidth = img.clientWidth;
  const currentHeight = img.clientHeight;

  const relativeMouseX = (scrollAdjustedMouseX - imgLeft) / currentWidth;
  const relativeMouseY = (scrollAdjustedMouseY - imgTop) / currentHeight;

  if (
    relativeMouseX < 0 ||
    relativeMouseX > 1 ||
    relativeMouseY < 0 ||
    relativeMouseY > 1
  ) {
    zoomOriginX = 0.5;
    zoomOriginY = 0.5;
  } else {
    zoomOriginX = relativeMouseX;
    zoomOriginY = relativeMouseY;
  }

  const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.1, Math.min(10, currentZoom * zoomFactor));

  if (newZoom === currentZoom) return;

  const oldZoom = currentZoom;
  currentZoom = newZoom;

  updateImageTransform();

  const scaleChange = newZoom / oldZoom;
  const newScrollLeft = scrollAdjustedMouseX * scaleChange - mouseX;
  const newScrollTop = scrollAdjustedMouseY * scaleChange - mouseY;

  scrollContainer.scrollLeft = newScrollLeft;
  scrollContainer.scrollTop = newScrollTop;

  renderLabelPoints();
}

const imageViewerEl = document.getElementById("imageViewer");
if (imageViewerEl) {
  imageViewerEl.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault();
      if (!currentImage) return;
      zoomImage(e.deltaY, e.clientX, e.clientY);
    },
    { passive: false }
  );
}

// --- 패닝 (드래그) ---

function setupImagePanning() {
  const scrollContainer = document.querySelector(".image-scroll-container");
  if (!scrollContainer) return;
  scrollContainer.removeEventListener("mousedown", handlePanStart);
  scrollContainer.addEventListener("mousedown", handlePanStart);
}

/**
 * [패닝 시작 핸들러 - 최종 수정]
 * - 불티 추가 모드 ON: 우클릭(2)으로 패닝 (좌클릭은 포인트 찍기용)
 * - 불티 추가 모드 OFF: 좌클릭(0)으로 패닝 (기본 동작)
 */
function handlePanStart(e) {
  // 모드에 따른 버튼 분기 (불티모드: 우클릭, 일반: 좌클릭)
  if (isAddingSpatter) {
    if (e.button !== 2) return;
  } else {
    if (e.button !== 0) return;
  }

  const scrollContainer = document.querySelector(".image-scroll-container");

  if (
    scrollContainer.scrollWidth > scrollContainer.clientWidth ||
    scrollContainer.scrollHeight > scrollContainer.clientHeight
  ) {
    if (e.button === 2) e.preventDefault();

    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartScrollX = scrollContainer.scrollLeft;
    panStartScrollY = scrollContainer.scrollTop;

    // [수정] 인라인 스타일 대신 클래스 추가 (CSS 우선순위 해결)
    scrollContainer.classList.add("is-panning");

    document.addEventListener("mousemove", handlePanMove);
    document.addEventListener("mouseup", handlePanEnd);
  }
}

function handlePanMove(e) {
  if (!isPanning) return;
  e.preventDefault();
  const deltaX = e.clientX - panStartX;
  const deltaY = e.clientY - panStartY;
  const scrollContainer = document.querySelector(".image-scroll-container");

  scrollContainer.scrollLeft = panStartScrollX - deltaX;
  scrollContainer.scrollTop = panStartScrollY - deltaY;
}

function handlePanEnd() {
  if (!isPanning) return;
  isPanning = false;

  const scrollContainer = document.querySelector(".image-scroll-container");

  // [수정] 클래스 제거
  scrollContainer.classList.remove("is-panning");

  // (혹시 남아있을 수 있는 인라인 스타일 제거)
  scrollContainer.style.cursor = "";

  document.removeEventListener("mousemove", handlePanMove);
  document.removeEventListener("mouseup", handlePanEnd);
}

// --- 라벨링 로직 ---

function setupLabelingMode() {
  const scrollContainer = document.querySelector(".image-scroll-container");
  const img = document.getElementById("documentImage");

  if (!scrollContainer || !img) return;
  scrollContainer.removeEventListener("click", handleLabelClick);
  scrollContainer.addEventListener("click", handleLabelClick);
  scrollContainer.classList.add("labeling-mode");
}

function handleLabelClick(e) {
  if (isPanning || !currentImage) return;
  if (labelPoints.length >= 4) {
    alert("최대 4개의 포인트만 찍을 수 있습니다.");
    return;
  }

  const img = document.getElementById("documentImage");
  const scrollContainer = document.querySelector(".image-scroll-container");
  if (!img || !scrollContainer) return;

  const imgRect = img.getBoundingClientRect();

  if (
    e.clientX < imgRect.left ||
    e.clientX > imgRect.right ||
    e.clientY < imgRect.top ||
    e.clientY > imgRect.bottom
  ) {
    return;
  }

  const clickX_in_Img = e.clientX - imgRect.left;
  const clickY_in_Img = e.clientY - imgRect.top;

  const normX = clickX_in_Img / imgRect.width;
  const normY = clickY_in_Img / imgRect.height;

  labelPoints.push({ normX, normY });

  renderLabelPoints();
  updateSpatterList();
}

/**
 * [라벨 포인트 렌더링 - 최종 수정]
 * - RGB 모드: 선택 시 노란색 (#ffff00)
 * - IR 모드: 선택 시 파란색 (#2962ff) - 흰 배경 가독성 확보
 */
function renderLabelPoints() {
  const scrollContainer = document.querySelector(".image-scroll-container");
  const img = document.getElementById("documentImage");
  let overlay = document.getElementById("labelOverlay");

  if (!img || !scrollContainer || !overlay) return;

  // [★] 현재 IR 모드인지 확인
  const isIRMode = document.body.classList.contains("ir-mode-active");

  const nw = img.naturalWidth;
  const nh = img.naturalHeight;

  overlay.innerHTML = "";

  const imgLeft = parseFloat(img.style.left) || 0;
  const imgTop = parseFloat(img.style.top) || 0;
  const imgWidth = parseFloat(img.style.width) || img.width;
  const imgHeight = parseFloat(img.style.height) || img.height;

  overlay.style.position = "absolute";
  overlay.style.left = imgLeft + "px";
  overlay.style.top = imgTop + "px";
  overlay.style.width = imgWidth + "px";
  overlay.style.height = imgHeight + "px";
  overlay.style.pointerEvents = "none";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";

  // --- 용접부 (기존 유지) ---
  let minX = 1,
    minY = 1,
    maxX = 0;
  if (labelPoints.length < 4) {
    labelPoints.forEach((point) => {
      if (point.normX < minX) minX = point.normX;
      if (point.normX > maxX) maxX = point.normX;
      if (point.normY < minY) minY = point.normY;
      const marker = document.createElement("div");
      marker.className = "label-point";
      marker.style.left = point.normX * 100 + "%";
      marker.style.top = point.normY * 100 + "%";
      marker.style.pointerEvents = "none";
      overlay.appendChild(marker);
    });
  } else {
    labelPoints.forEach((point) => {
      if (point.normX < minX) minX = point.normX;
      if (point.normX > maxX) maxX = point.normX;
      if (point.normY < minY) minY = point.normY;
    });
  }

  if (labelPoints.length > 0) {
    const pointsStr = labelPoints
      .map((p) => `${p.normX * imgWidth},${p.normY * imgHeight}`)
      .join(" ");
    const shapeType = labelPoints.length === 4 ? "polygon" : "polyline";
    const polygon = document.createElementNS(svgNS, shapeType);
    polygon.setAttribute("points", pointsStr);

    if (labelPoints.length === 4) {
      polygon.setAttribute("class", "label-polygon");
      polygon.setAttribute("stroke", "#2ecc71");
      polygon.setAttribute("fill", "rgba(46, 204, 113, 0.15)");
      polygon.setAttribute("stroke-width", "1");
      polygon.style.pointerEvents = "auto";
      polygon.style.cursor = "move";
      polygon.addEventListener("mousedown", handleWeldDragStart);
    } else {
      polygon.setAttribute("stroke", "#2ecc71");
      polygon.setAttribute("stroke-width", "2");
      polygon.setAttribute("fill", "none");
      polygon.setAttribute("stroke-dasharray", "4,4");
    }
    svg.appendChild(polygon);

    if (labelPoints.length === 4) {
      const labelDiv = document.createElement("div");
      labelDiv.className = "weld-zone-label";
      labelDiv.textContent = "용접부";
      const centerX = (minX + maxX) / 2;
      labelDiv.style.left = centerX * 100 + "%";
      labelDiv.style.top = minY * 100 + "%";
      labelDiv.style.cursor = "move";
      labelDiv.style.pointerEvents = "auto";
      labelDiv.addEventListener("mousedown", handleWeldDragStart);
      overlay.appendChild(labelDiv);
    }
  }

  // --- 불티 (수정됨) ---
  if (spatterData && spatterData.length > 0) {
    spatterData.forEach((spatter, index) => {
      if (!spatter.points || spatter.points.length === 0) return;

      const isActive = spatter.id === selectedSpatterId;

      // [★ 핵심 수정] 모드에 따른 색상 분기
      // IR 모드: 파란색(#2962ff) / RGB 모드: 노란색(#ffff00)
      const activeColor = isIRMode ? "#2962ff" : "#ffff00";
      const activeFill = isIRMode
        ? "rgba(41, 98, 255, 0.4)"
        : "rgba(255, 255, 0, 0.3)";

      // 비활성 상태: 빨간색(#ff4444)
      const strokeColor = isActive ? activeColor : "#ff4444";
      const fillColor = isActive ? activeFill : "rgba(255, 0, 0, 0.35)";
      const zIndex = isActive ? "100" : "1";

      const pointsStr = spatter.points
        .map((p) => `${p.x * imgWidth},${p.y * imgHeight}`)
        .join(" ");
      const polygon = document.createElementNS(svgNS, "polygon");
      polygon.setAttribute("points", pointsStr);

      let polyClass = "spatter-polygon";
      if (isActive) polyClass += " active";
      polygon.setAttribute("class", polyClass);
      polygon.id = `poly-${spatter.id}`;

      // 색상 적용
      polygon.setAttribute("stroke", strokeColor);
      polygon.setAttribute("fill", fillColor);
      polygon.setAttribute("stroke-width", isActive ? "2" : "1");

      polygon.style.pointerEvents = "auto";
      polygon.onclick = (e) => {
        e.stopPropagation();
        highlightSpatter(index);
      };
      svg.appendChild(polygon);

      let topY = 1,
        topX = 0;
      spatter.points.forEach((pt, ptIdx) => {
        if (pt.y < topY) {
          topY = pt.y;
          topX = pt.x;
        }
        const marker = document.createElement("div");
        marker.className = `spatter-point spatter-grp-${spatter.id}`;
        if (isActive) marker.classList.add("active");
        if (ptIdx === 0) marker.id = `pt-${spatter.id}`;

        marker.style.left = pt.x * 100 + "%";
        marker.style.top = pt.y * 100 + "%";
        marker.style.zIndex = zIndex;

        marker.style.borderColor = strokeColor;
        if (isActive) {
          marker.style.backgroundColor = isIRMode ? "#2962ff" : "#ffff00"; // 포인트 내부 색상
          marker.style.transform = "translate(-50%, -50%) scale(1.2)";
        }

        marker.style.pointerEvents = "auto";
        marker.addEventListener("mousedown", (e) => {
          handleSpatterPointDragStart(e, index, ptIdx);
        });
        overlay.appendChild(marker);
      });

      const label = document.createElement("div");
      label.className = "spatter-label";
      if (isActive) label.classList.add("active");
      label.id = `lbl-${spatter.id}`;
      label.textContent = `#${spatter.id}`;
      label.style.left = topX * 100 + "%";
      label.style.top = topY * 100 + "%";
      label.style.zIndex = zIndex;

      if (isActive) {
        label.style.backgroundColor = strokeColor;
        label.style.color = isIRMode ? "#fff" : "#000"; // 배경 밝기에 따라 텍스트 색 조정
      } else {
        label.style.backgroundColor = "";
        label.style.color = "";
      }

      overlay.appendChild(label);
    });
  }

  // --- 생성 중 불티 (기존 유지) ---
  if (isAddingSpatter && tempSpatterPoints.length > 0) {
    tempSpatterPoints.forEach((pt) => {
      const marker = document.createElement("div");
      marker.className = "spatter-point";
      marker.style.left = pt.x * 100 + "%";
      marker.style.top = pt.y * 100 + "%";
      marker.style.pointerEvents = "none";
      overlay.appendChild(marker);
    });
    if (tempSpatterPoints.length > 1) {
      const pointsStr = tempSpatterPoints
        .map((p) => `${p.x * imgWidth},${p.y * imgHeight}`)
        .join(" ");
      const line = document.createElementNS(svgNS, "polyline");
      line.setAttribute("points", pointsStr);
      line.setAttribute("stroke", "#ff4444");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke-dasharray", "3,3");
      svg.appendChild(line);
    }
  }
  overlay.appendChild(svg);
}

/**
 * [헬퍼] 불티 추가 모드 강제 종료 함수
 * - 다른 동작(선택, 삭제, 드래그 등)이 발생하면 호출하여 모드를 끕니다.
 */
function exitSpatterMode() {
  if (!isAddingSpatter) return; // 이미 꺼져있으면 패스

  isAddingSpatter = false;
  tempSpatterPoints = []; // 찍고 있던 임시 점 초기화

  // UI 상태 원복
  const spatterBtn = document.querySelector(".side-tab-btn.spatter");
  const scrollContainer = document.querySelector(".image-scroll-container");

  if (spatterBtn) spatterBtn.classList.remove("active-mode");
  if (scrollContainer) {
    scrollContainer.classList.remove("labeling-mode");
    scrollContainer.removeEventListener("click", handleSpatterAddClick);
  }

  renderLabelPoints(); // 화면 갱신 (임시 점 제거)
  console.log("다른 동작 감지로 불티 모드 자동 종료");
}

/**
 * [불티 하이라이트 함수 - 최종 수정]
 * - 기능: 선택 시 JSON에 저장되는 원본 좌표(0~1)를 콘솔에 출력
 */
function highlightSpatter(index, shouldScroll = true, keepAddingMode = false) {
  // 1. 모드 정리
  if (!keepAddingMode) {
      exitSpatterMode();
  }

  const spatter = spatterData[index];
  if (!spatter) return;

  const spatterId = spatter.id;
  selectedSpatterId = spatterId;

  // ============================================================
  // [★수정됨] JSON 원본 포맷 (0~1 범위 좌표) 콘솔 출력
  // ============================================================
  console.group(`💾 불티 #${spatterId} 원본 데이터 (JSON 저장 포맷)`);
  
  // 1. 보기 편한 표 형식 (0.xxxx 형태)
  const rawPoints = spatter.points.map((p, i) => ({
      idx: i + 1,
      x: p.x, // 0~1 사이의 정규화된 값 (가로 비율)
      y: p.y  // 0~1 사이의 정규화된 값 (세로 비율)
  }));
  console.table(rawPoints);

  // 2. 복사하기 편한 텍스트 형식
  console.log("Raw Array:", JSON.stringify(spatter.points, null, 2));
  console.groupEnd();
  // ============================================================

  // 2. 불티 추가 모드 자동 종료 로직 (기존 유지)
  if (
    !keepAddingMode &&
    typeof isAddingSpatter !== "undefined" &&
    isAddingSpatter
  ) {
    isAddingSpatter = false;
    tempSpatterPoints = [];

    const scrollContainer = document.querySelector(".image-scroll-container");
    const btn = document.querySelector(".side-tab-btn.spatter");

    if (scrollContainer) {
      scrollContainer.classList.remove("labeling-mode");
      scrollContainer.removeEventListener("click", handleSpatterAddClick);
    }
    if (btn) {
      btn.classList.remove("active-mode");
    }
    renderLabelPoints();
  }

  // 3. 기존 하이라이트 제거
  const selectedItems = document.querySelectorAll(".spatter-item.selected");
  selectedItems.forEach((el) => el.classList.remove("selected"));

  const activeOverlayElems = document.querySelectorAll(
    ".spatter-polygon.active, .spatter-point.active, .spatter-label.active"
  );
  activeOverlayElems.forEach((el) => el.classList.remove("active"));

  // 4. 리스트 아이템 강조 및 중앙 스크롤
  const listItem = document.getElementById(`list-item-${spatterId}`);
  if (listItem) {
    listItem.classList.add("selected");
    if (shouldScroll) {
      listItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // 5. 이미지 요소 강조
  const poly = document.getElementById(`poly-${spatterId}`);
  const pt = document.getElementById(`pt-${spatterId}`);
  const lbl = document.getElementById(`lbl-${spatterId}`);

  if (poly) poly.classList.add("active");
  if (pt) pt.classList.add("active");
  if (lbl) lbl.classList.add("active");

  const points = document.querySelectorAll(`.spatter-grp-${spatterId}`);
  points.forEach((p) => p.classList.add("active"));

  // 6. 뷰어 스크롤 이동
  if (shouldScroll) {
    const scrollContainer = document.querySelector(".image-scroll-container");
    const img = document.getElementById("documentImage");

    if (spatter.points && spatter.points.length > 0 && img) {
      let sumX = 0, sumY = 0;
      spatter.points.forEach((p) => {
        sumX += p.x;
        sumY += p.y;
      });
      const centerX = sumX / spatter.points.length;
      const centerY = sumY / spatter.points.length;

      const currentWidth = parseFloat(img.style.width) || img.width;
      const currentHeight = parseFloat(img.style.height) || img.height;

      const targetX = centerX * currentWidth;
      const targetY = centerY * currentHeight;

      const viewerW = scrollContainer.clientWidth;
      const viewerH = scrollContainer.clientHeight;

      const scrollLeft = targetX + img.offsetLeft - viewerW / 2;
      const scrollTop = targetY + img.offsetTop - viewerH / 2;

      scrollContainer.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }
}

/**
 * [헬퍼] 다각형 면적 계산 (Shoelace Formula)
 * points: {x, y} (픽셀 좌표) 배열
 */
function calculatePolygonArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * [헬퍼] 다각형 중심점(Centroid) 계산
 * points: {x, y} (픽셀 좌표) 배열
 */
function getPolygonCenter(points) {
  let x = 0,
    y = 0;
  points.forEach((p) => {
    x += p.x;
    y += p.y;
  });
  return { x: x / points.length, y: y / points.length };
}

/**
 * [헬퍼] 두 점 사이의 거리 계산
 */
function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * [불티 추가 모드 클릭 핸들러 - 수정됨]
 * - 수정사항: 불티 생성 직후 recalculateSingleSpatter 호출하여 IR 온도/크기 계산
 */
function handleSpatterAddClick(e) {
  if (isPanning || !isAddingSpatter) return;

  const img = document.getElementById("documentImage");
  if (!img) return;

  const rect = img.getBoundingClientRect();

  if (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  )
    return;

  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;

  tempSpatterPoints.push({ x, y });

  // 3. 점 4개가 모이면 불티 생성 완료
  if (tempSpatterPoints.length === 4) {
    isUserModified = true;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    // 초기값 설정 (일단 0으로 넣고 재계산 함수에서 채움)
    const spatterPixels = tempSpatterPoints.map((p) => ({
      x: p.x * nw,
      y: p.y * nh,
    }));
    const areaVal = Math.floor(calculatePolygonArea(spatterPixels));
    let distVal = 0;

    // (거리 계산 로직은 RGB용이지만 일단 유지)
    if (labelPoints.length > 0) {
      const weldPixels = labelPoints.map((p) => ({
        x: p.normX * nw,
        y: p.normY * nh,
      }));
      const spatterCenter = getPolygonCenter(spatterPixels);
      const weldCenter = getPolygonCenter(weldPixels);
      distVal = Math.floor(getDistance(spatterCenter, weldCenter));
    }

    const typeVal = distVal >= 400 ? 2 : 1;
    const maxId =
      spatterData.length > 0 ? Math.max(...spatterData.map((s) => s.id)) : 0;
    const newId = maxId + 1;

    // 데이터 추가
    spatterData.push({
      id: newId,
      points: [...tempSpatterPoints],
      type: typeVal,
      size: areaVal, // IR일 경우 아래 재계산 함수에서 덮어씌워짐
      distance: distVal,
      temp: 0, // IR일 경우 아래 재계산 함수에서 덮어씌워짐
    });

    tempSpatterPoints = [];

    // [★핵심 수정] 방금 추가된 불티에 대해 정밀 분석(IR 온도/크기) 수행
    const newIndex = spatterData.length - 1;
    recalculateSingleSpatter(newIndex);

    // UI 갱신
    updateSpatterList();
    highlightSpatter(newIndex, true, true);

    console.log(`[연속 추가] 불티 #${newId} 생성 완료 및 분석 끝.`);
  }

  renderLabelPoints();
}

function exportCoordinates() {
  if (labelPoints.length === 0) return;
  const img = document.getElementById("documentImage");

  const data = {
    image: imageList[currentImageIndex]?.name,
    resolution: { width: img.naturalWidth, height: img.naturalHeight },
    points: labelPoints.map((p, i) => ({
      id: i + 1,
      x: Math.round(p.normX * img.naturalWidth),
      y: Math.round(p.normY * img.naturalHeight),
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `label_${Date.now()}.json`;
  a.click();
}

// --- 공통 기능 ---

/**
 * [썸네일 리스트 초기화 및 가상 스크롤 설정]
 * noImagesMessage 요소가 삭제되는 문제를 해결했습니다.
 */
function updateThumbnailList() {
  const thumbnailList = document.getElementById("thumbnailList");

  // 1. noImagesMessage 요소 안전하게 가져오기 (없으면 생성)
  let noImagesMessage = document.getElementById("noImagesMessage");
  if (!noImagesMessage) {
    noImagesMessage = document.createElement("div");
    noImagesMessage.id = "noImagesMessage";
    noImagesMessage.className = "no-images";
    noImagesMessage.textContent = "이미지가 없습니다";
    // 필요한 경우 CSS 클래스나 스타일 추가
  }

  // 2. 데이터 없음 처리
  if (imageList.length === 0) {
    thumbnailList.innerHTML = "";
    thumbnailList.appendChild(noImagesMessage);
    noImagesMessage.style.display = "block";
    return;
  }

  // 데이터가 있을 때는 메시지를 숨기거나 리스트에서 제거해야 함
  // 아래 innerHTML = '' 에서 어차피 제거되므로 스타일 조작 불필요할 수도 있으나, 안전하게 처리
  if (noImagesMessage.parentNode === thumbnailList) {
    noImagesMessage.style.display = "none";
  }

  // 3. 가상 스크롤 영역 설정
  // 기존 내용을 모두 지우고 (여기서 noImagesMessage도 DOM에서 사라짐) 새로 시작
  const totalHeight = imageList.length * THUMB_HEIGHT;
  const spacer = document.createElement("div");
  spacer.id = "virtualSpacer";
  spacer.style.height = `${totalHeight}px`;
  spacer.style.width = "1px";
  spacer.style.position = "absolute";
  spacer.style.top = "0";
  spacer.style.zIndex = "-1";

  thumbnailList.innerHTML = "";
  thumbnailList.appendChild(spacer);

  // 4. 이벤트 잠시 제거
  thumbnailList.onscroll = null;

  // 5. 비동기 렌더링 (높이 계산 후 스크롤 초기화)
  setTimeout(() => {
    thumbnailList.scrollTop = 0;
    renderVirtualThumbnails();
    thumbnailList.onscroll = renderVirtualThumbnails;
    updateThumbnailActiveState();
  }, 0);
}

/**
 * [썸네일 활성 상태 표시 - 수정됨]
 * 가상 스크롤에서는 DOM에 해당 아이템이 없을 수도 있습니다.
 * DOM에 있으면 클래스를 붙이고, 없으면 스크롤만 이동시킵니다.
 */
function updateThumbnailActiveState() {
  const thumbnailList = document.getElementById("thumbnailList");

  // 1. 기존 active 제거
  const activeItems = thumbnailList.querySelectorAll(".thumbnail-item.active");
  activeItems.forEach((item) => item.classList.remove("active"));

  // 2. 현재 인덱스 아이템이 화면(DOM)에 그려져 있는지 확인
  const currentWrapper = thumbnailList.querySelector(
    `.thumbnail-wrapper[data-index="${currentImageIndex}"]`
  );

  if (currentWrapper) {
    // DOM에 있으면 스타일 적용
    const item = currentWrapper.querySelector(".thumbnail-item");
    if (item) item.classList.add("active");
  } else {
    // DOM에 없으면(스크롤 범위 밖이면) 스타일을 줄 수 없지만,
    // renderVirtualThumbnails 함수 내에서 렌더링 시점에 체크하므로 괜찮습니다.
  }

  // *중요: 키보드 이동 등으로 active가 바뀌었을 때, 해당 위치로 스크롤을 이동시켜야 함
  // 단, 사용자가 직접 스크롤 중일 때는 방해하지 않도록 로직 분리 필요하지만,
  // 여기서는 '클릭'이나 '키보드'로 이동 시 해당 위치가 보이도록 자동 스크롤 처리
  scrollToActiveThumbnail();
}

/**
 * [활성 썸네일로 스크롤 이동]
 * 선택된 이미지가 화면 밖이라 렌더링되지 않았을 경우 강제로 스크롤을 조정합니다.
 */
function scrollToActiveThumbnail() {
  const thumbnailList = document.getElementById("thumbnailList");
  const targetTop = currentImageIndex * THUMB_HEIGHT;

  // 현재 스크롤 뷰포트 범위
  const scrollTop = thumbnailList.scrollTop;
  const clientHeight = thumbnailList.clientHeight;

  // 타겟이 뷰포트 밖에 있다면 스크롤 이동
  if (
    targetTop < scrollTop ||
    targetTop > scrollTop + clientHeight - THUMB_HEIGHT
  ) {
    thumbnailList.scrollTop = targetTop - clientHeight / 2 + THUMB_HEIGHT / 2; // 화면 중앙에 오도록
  }
}

/**
 * [가상 스크롤 렌더링 (핵심 로직) - 수정됨]
 * - 수정사항: imageData.status 값을 확인하여 배지 클래스(saved, deleted, visited) 적용
 */
function renderVirtualThumbnails() {
  const thumbnailList = document.getElementById("thumbnailList");
  const scrollTop = thumbnailList.scrollTop;
  const containerHeight = thumbnailList.clientHeight;

  // 1. 보여줄 시작 인덱스와 끝 인덱스 계산
  let startIndex = Math.floor(scrollTop / THUMB_HEIGHT) - BUFFER_COUNT;
  let endIndex =
    Math.ceil((scrollTop + containerHeight) / THUMB_HEIGHT) + BUFFER_COUNT;

  // 범위 제한
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(imageList.length, endIndex);

  // 2. 기존에 렌더링된 아이템들 제거 (Spacer는 유지)
  const existingItems = thumbnailList.querySelectorAll(".thumbnail-wrapper");
  existingItems.forEach((item) => item.remove());

  // 3. 템플릿 준비
  const template = document.getElementById("thumbnailTemplate");
  const fragment = document.createDocumentFragment();

  // 4. 해당 범위의 아이템만 생성하여 DOM에 추가
  for (let i = startIndex; i < endIndex; i++) {
    const imageData = imageList[i];
    const clone = template.content.cloneNode(true);

    const wrapper = clone.querySelector(".thumbnail-wrapper");
    const imgElement = clone.querySelector(".thumbnail-image");
    const indexElement = clone.querySelector(".thumbnail-index");
    const nameElement = clone.querySelector(".thumbnail-name");
    const itemDiv = wrapper.querySelector(".thumbnail-item"); // 스타일 적용 대상

    // ★ 절대 위치 지정
    wrapper.style.top = `${i * THUMB_HEIGHT}px`;

    // 데이터 바인딩
    wrapper.dataset.index = i;
    
    // 현재 보고 있는 이미지라면 active 클래스 추가
    if (i === currentImageIndex) {
      itemDiv.classList.add("active");
    }

    // ============================================================
    // [★핵심 추가] 상태 배지 클래스 적용
    // ============================================================
    // 1. 기존 클래스 초기화
    itemDiv.classList.remove("status-saved", "status-deleted", "status-visited");

    // 2. 상태값에 따라 클래스 부여 (CSS에서 아이콘 표시됨)
    if (imageData.status === "saved") {
        itemDiv.classList.add("status-saved");      // 초록색 체크 ✅
    } else if (imageData.status === "deleted") {
        itemDiv.classList.add("status-deleted");    // 빨간색 휴지통 🗑️
    } else if (imageData.status === "visited") {
        itemDiv.classList.add("status-visited");    // 회색 눈 👁️
    }
    // ============================================================

    indexElement.textContent = i + 1;
    nameElement.textContent = imageData.name;
    nameElement.title = imageData.name;

    // 이미지 로드
    if (imageData.dataURL) {
      imgElement.src = imageData.dataURL;
    } else {
      const reader = new FileReader();
      reader.onload = function (e) {
        imageData.dataURL = e.target.result; 
        const currentWrapper = thumbnailList.querySelector(
          `.thumbnail-wrapper[data-index="${i}"] .thumbnail-image`
        );
        if (currentWrapper) currentWrapper.src = e.target.result;
      };
      reader.readAsDataURL(imageData.file);
    }

    // 클릭 이벤트
    itemDiv.addEventListener("click", () => {
      loadImageFromList(i);
    });

    fragment.appendChild(clone);
  }

  thumbnailList.appendChild(fragment);
}

function clearAllPoints() {
  if (labelPoints.length === 0) return;

  if (confirm("모든 포인트를 삭제하시겠습니까?")) {
    labelPoints = [];
    renderLabelPoints();
    updateSpatterList();
  }
}

/**
 * [현재 이미지 초기화 함수]
 * - 기능: 현재 보고 있는 이미지를 리로드하여 초기 상태(원본 JSON)로 복구합니다.
 * - 대상: 용접부 위치, 불티 삭제 내역, 헤더 정보, 줌/패닝 상태 등
 */
function resetCurrentImage() {
  // 이미지가 없으면 실행하지 않음
  if (imageList.length === 0 || currentImageIndex < 0) {
    alert("초기화할 이미지가 없습니다.");
    return;
  }

  if (
    confirm(
      "현재 이미지의 모든 수정 사항을 초기화하시겠습니까?\n(처음 불러온 상태로 복구됩니다)"
    )
  ) {
    isUserModified = false;
    // [핵심] 현재 인덱스의 이미지를 다시 불러옵니다.
    // 이 과정에서 labelPoints, spatterData, Header Metadata가 모두 원본 파일 기준으로 재설정됩니다.
    loadImageFromList(currentImageIndex);

    console.log(`이미지 #${currentImageIndex + 1} 초기화 완료`);
  }
}
/**
 * [홈 버튼 기능 추가]
 * 사이드 탭의 홈 버튼 클릭 시 이미지 줌/위치 리셋 (화면 맞춤)
 */
const homeBtn = document.querySelector(".side-tab-btn.home");
if (homeBtn) {
  homeBtn.addEventListener("click", function () {
    // 이미지가 로드된 상태라면 화면 맞춤 함수 실행
    if (currentImage) {
      fitImageToViewer();
    }
  });
}

/**
 * [폴더 열기 함수 - 수정됨]
 * - 기능 추가: 각 파일 객체에 'parentHandle'(부모 폴더 권한)을 저장
 * (나중에 그 폴더 안에서 삭제/이름변경을 하기 위함)
 */
async function loadDirectoryWithPermission() {
  try {
    directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite' 
    });

    const files = [];

    // [수정] dir(현재 폴더 핸들)을 인자로 받음
    async function collectFiles(dir, path = "") {
      for await (const entry of dir.values()) {
        // [★추가] 삭제된 파일(DEL_)이나 숨김 파일(._)은 아예 건너뛰기
        if (entry.name.startsWith("DEL_") || entry.name.startsWith("._")) {
            continue;
        }
        if (entry.kind === "file") {
          const file = await entry.getFile();
          
          file.handle = entry; 
          file.parentHandle = dir; // [★핵심] 부모 폴더 핸들 저장!
          
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path + file.name
          });
          
          files.push(file);
        } else if (entry.kind === "directory") {
          // 재귀 호출 시 현재 entry(하위 폴더)를 넘겨줌
          await collectFiles(entry, path + entry.name + "/");
        }
      }
    }

    await collectFiles(directoryHandle); 
    loadImages(files); 

  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error("폴더 열기 실패:", err);
      alert("폴더 접근 권한이 없거나 지원하지 않는 브라우저입니다.");
    }
  }
}

/**
 * [파일 이름 변경 헬퍼 함수 - 수정됨]
 * - 수정사항: 접두어 붙이기 방식 -> '새로운 이름(newName)'을 직접 받는 방식으로 변경 (복구 기능 지원)
 */
async function renameFile(parentHandle, oldName, newName) {
  if (!parentHandle) return null;

  try {
    const oldHandle = await parentHandle.getFileHandle(oldName);
    const file = await oldHandle.getFile();
    
    // 파일 내용 복사
    // (대용량 파일일 경우 이 방식은 메모리를 사용하므로 move()가 있다면 좋겠지만, 표준 API에서는 이 방식이 안전함)
    const content = await file.arrayBuffer();

    // 새 파일 생성
    const newHandle = await parentHandle.getFileHandle(newName, { create: true });
    const writable = await newHandle.createWritable();
    
    await writable.write(content);
    await writable.close();

    // 원본 삭제
    await parentHandle.removeEntry(oldName);
    
    console.log(`♻️ 파일명 변경 성공: ${oldName} -> ${newName}`);
    return newHandle; 

  } catch (err) {
    console.error(`이름 변경 실패 (${oldName} -> ${newName}):`, err);
    return null;
  }
}

/**
 * [이미지(세트) 삭제/복구 토글 핸들러 - 수정됨]
 * - 기능: 
 * 1. 일반 상태면 -> 삭제 (DEL_ 붙임)
 * 2. 이미 삭제된 상태면 -> 복구 (DEL_ 제거)
 */
async function handleDeleteCurrentPair() {
  if (!directoryHandle) {
    alert("폴더 권한이 없습니다. [데이터 불러오기]를 다시 실행해주세요.");
    return;
  }
  if (imageList.length === 0 || !imageList[currentImageIndex]) {
    alert("처리할 이미지가 없습니다.");
    return;
  }

  const currentItem = imageList[currentImageIndex];

  // ============================================================
  // [분기] 이미 삭제된 파일(DEL_)이라면 -> 복구 모드로 진입
  // ============================================================
  if (currentItem.status === "deleted" || currentItem.name.startsWith("DEL_")) {
      await restoreCurrentPair();
      return;
  }

  // ============================================================
  // [기존 로직] 삭제 모드
  // ============================================================
  
  if (!confirm(`현재 이미지 세트(${currentItem.name})를\n삭제하시겠습니까?`)) {
    return;
  }

  try {
    // 짝꿍 찾기
    let pairItem = null;
    let pairName = "";
    if (currentItem.name.includes("_RGB_")) pairName = currentItem.name.replace("_RGB_", "_IR_");
    else if (currentItem.name.includes("_IR_")) pairName = currentItem.name.replace("_IR_", "_RGB_");
    if (pairName) pairItem = imageList.find(item => item.name === pairName);

    const prefix = "DEL_";

    // 원래 이름 저장 (로컬 스토리지 키 검색용)
    const oldCurrentName = currentItem.name;
    const oldPairName = pairItem ? pairItem.name : null;

    // 핸들 업데이트 (이름 변경: oldName -> DEL_oldName)
    const updateItemHandles = async (item) => {
        const newName = prefix + item.name; // [수정] 새 이름 생성

        // 1. 이미지 파일 변경
        if (item.file && item.file.parentHandle) {
            const newHandle = await renameFile(item.file.parentHandle, item.name, newName);
            if (newHandle) {
                const newFile = await newHandle.getFile();
                newFile.handle = newHandle;
                newFile.parentHandle = item.file.parentHandle;
                item.file = newFile; 
                item.name = newFile.name; 
            }
        }
        // 2. JSON 파일 변경
        if (item.jsonFileHandle) {
             const pHandle = (item.jsonFile && item.jsonFile.parentHandle) 
                             || (item.file && item.file.parentHandle) 
                             || directoryHandle;
             
             // JSON 파일명 유추
             const rawName = item.name.startsWith(prefix) ? item.name.substring(prefix.length) : item.name;
             const jsonOldName = rawName.replace(/\.[^/.]+$/, "") + ".json";
             const jsonNewName = prefix + jsonOldName;
             
             const newJsonHandle = await renameFile(pHandle, jsonOldName, jsonNewName);
             
             if (newJsonHandle) {
                 const newJsonFile = await newJsonHandle.getFile();
                 newJsonFile.parentHandle = pHandle;
                 item.jsonFile = newJsonFile;
                 item.jsonFileHandle = newJsonHandle;
             }
        }
    };

    await updateItemHandles(currentItem);
    if (pairItem) await updateItemHandles(pairItem);

    // 상태 변경 (deleted)
    imageList[currentImageIndex].status = "deleted";
    renameLocalStatus(currentItem.path, oldCurrentName, currentItem.name, "deleted");

    if (pairItem) {
        pairItem.status = "deleted";
        renameLocalStatus(pairItem.path, oldPairName, pairItem.name, "deleted");
    }

    renderVirtualThumbnails(); 
    
    // 버튼 UI 갱신 (휴지통 -> 복구 아이콘으로 변경)
    updateDeleteButtonUI(); 

    console.log("삭제 처리 완료");

    // 다음 이미지로 자동 이동 (선택 사항)
    // 삭제 후 바로 이동하고 싶다면 아래 주석을 해제하세요.
    /*
    if (currentImageIndex < imageList.length - 1) {
        let nextIndex = currentImageIndex + 1;
        while (nextIndex < imageList.length && imageList[nextIndex].status === "deleted") {
             nextIndex++;
        }
        if (nextIndex < imageList.length) loadImageFromList(nextIndex);
    }
    */

  } catch (err) {
    console.error("삭제 처리 중 오류:", err);
    alert("삭제 처리에 실패했습니다.");
  }
}

/**
 * [이미지 복구 함수 - 신규]
 * - 기능: DEL_ 접두어를 제거하고 상태를 'visited'로 변경
 */
async function restoreCurrentPair() {
  const currentItem = imageList[currentImageIndex];
  
  if (!confirm(`삭제된 이미지(${currentItem.name})를\n복구하시겠습니까?`)) {
    return;
  }

  try {
    // 짝꿍 찾기
    let pairItem = null;
    // 현재 이름(DEL_...) 기준 짝꿍 이름 찾기
    let pairName = "";
    if (currentItem.name.includes("_RGB_")) pairName = currentItem.name.replace("_RGB_", "_IR_");
    else if (currentItem.name.includes("_IR_")) pairName = currentItem.name.replace("_IR_", "_RGB_");
    if (pairName) pairItem = imageList.find(item => item.name === pairName);

    // 복구 로직 (핸들 업데이트)
    const restoreItemHandles = async (item) => {
        // "DEL_" 제거
        const originalName = item.name.replace(/^DEL_/, ""); 

        // 1. 이미지 파일 변경
        if (item.file && item.file.parentHandle) {
            const newHandle = await renameFile(item.file.parentHandle, item.name, originalName);
            if (newHandle) {
                const newFile = await newHandle.getFile();
                newFile.handle = newHandle;
                newFile.parentHandle = item.file.parentHandle;
                item.file = newFile; 
                item.name = newFile.name; // 이름 원복
            }
        }
        // 2. JSON 파일 변경
        if (item.jsonFileHandle) {
             const pHandle = (item.jsonFile && item.jsonFile.parentHandle) 
                             || (item.file && item.file.parentHandle) 
                             || directoryHandle;
             
             // 현재 JSON 이름 (DEL_...json)
             const currentJsonName = item.name.replace(/\.[^/.]+$/, "") + ".json";
             // 목표 JSON 이름 (...json) - DEL_만 뺌
             // 주의: item.name은 위에서 이미 원복되었으므로 다시 DEL_ 붙여서 로직 구성하거나,
             // 더 간단하게 replace로 처리
             const targetJsonName = currentJsonName.replace(/^DEL_/, "");
             
             // 실제 파일시스템에는 아직 DEL_...json으로 존재하므로 그걸 찾아서 바꿈
             // (위에서 item.name이 바뀌었어도 파일시스템의 JSON은 아직 안바뀜)
             // 로직 단순화: 현재 item.jsonFile.name 활용
             const actualJsonName = item.jsonFile.name;
             const newJsonName = actualJsonName.replace(/^DEL_/, "");

             const newJsonHandle = await renameFile(pHandle, actualJsonName, newJsonName);
             
             if (newJsonHandle) {
                 const newJsonFile = await newJsonHandle.getFile();
                 newJsonFile.parentHandle = pHandle;
                 item.jsonFile = newJsonFile;
                 item.jsonFileHandle = newJsonHandle;
             }
        }
    };

    // 파일명 변경 실행
    // 로컬 스토리지 키 변경을 위해 옛날 이름(DEL_...) 저장
    const oldCurrentName = currentItem.name;
    const oldPairName = pairItem ? pairItem.name : null;

    await restoreItemHandles(currentItem);
    if (pairItem) await restoreItemHandles(pairItem);

    // 상태 변경 (visited로 복구)
    // 저장된 적이 있는지 확인은 어렵지만, 보통 보고 지웠으므로 visited가 안전함
    // 혹은 saved 여부를 로컬스토리지 뒤져야하지만, 일단 visited로 통일
    currentItem.status = "visited";
    renameLocalStatus(currentItem.path, oldCurrentName, currentItem.name, "visited");

    if (pairItem) {
        pairItem.status = "visited";
        renameLocalStatus(pairItem.path, oldPairName, pairItem.name, "visited");
    }

    renderVirtualThumbnails();
    
    // 버튼 UI 갱신 (복구 아이콘 -> 휴지통으로 변경)
    updateDeleteButtonUI(); 

    alert("이미지가 복구되었습니다.");

  } catch (err) {
    console.error("복구 처리 중 오류:", err);
    alert("복구 처리에 실패했습니다.");
  }
}

/**
 * [삭제 버튼 UI 갱신 함수]
 * - 현재 이미지가 DEL_ 상태면 -> 복구 아이콘/색상
 * - 일반 상태면 -> 휴지통 아이콘/색상
 */
function updateDeleteButtonUI() {
    const btn = document.getElementById("btnDelete");
    if (!btn || imageList.length === 0) return;

    const currentItem = imageList[currentImageIndex];
    const isDeleted = currentItem.status === "deleted" || currentItem.name.startsWith("DEL_");

    if (isDeleted) {
        // 복구 모드 스타일
        btn.innerHTML = '<i class="fa-solid fa-trash-arrow-up"></i> 복구';
        btn.style.backgroundColor = "#27ae60"; // 초록색
        btn.style.borderColor = "#2ecc71";
        btn.title = "삭제된 이미지를 복구합니다";
    } else {
        // 삭제 모드 스타일 (기본)
        btn.innerHTML = '<i class="fa-solid fa-trash"></i> 삭제';
        btn.style.backgroundColor = ""; // CSS 기본값(회색/빨강hover) 따름
        btn.style.borderColor = "";
        btn.title = "현재 이미지를 삭제합니다";
    }
}

/**
 * [데이터 동기화 함수]
 * 화면의 최신 데이터(UI)를 원본 JSON 객체(Memory)에 반영
 */
function syncUiDataToJson() {
  if (!currentJsonData) return;

  // 1. 불티 데이터 초기화 (기존 데이터 비우기)
  currentJsonData.spatter_annotations = [];
  currentJsonData.annotations_auto = [];

  // 2. 화면의 불티 데이터(spatterData)를 JSON 구조에 매핑
  spatterData.forEach((item) => {
    // (1) 좌표 및 타입 정보
    currentJsonData.spatter_annotations.push({
      spatter_id: item.id,
      spatter_type: item.type,
      spatter_form: item.form || 1, // 기존에 없으면 기본값 1
      points: item.points.map((p) => ({ x: p.x, y: p.y })),
    });

    // (2) 메타 데이터 (크기, 거리, 온도)
    currentJsonData.annotations_auto.push({
      spatter_id: item.id,
      spatter_size: item.size,
      spatter_distance: item.distance,
      spatter_temp: item.temp,
    });
  });

  // 3. 용접부 데이터 반영
  if (!currentJsonData.annotations) currentJsonData.annotations = {};
  currentJsonData.annotations.weld_zone = labelPoints.map((p) => ({
    x: p.normX,
    y: p.normY,
  }));

  // 주의: weld_progress 등 UI에서 건드리지 않는 값은 원본(currentJsonData) 그대로 유지됨

  // 4. 캡션 텍스트 반영
  const captionEl = document.getElementById("captionText");
  if (captionEl && currentJsonData.image_caption) {
    currentJsonData.image_caption.text = captionEl.innerText;
  }

  console.log("✅ UI 데이터가 JSON 객체로 동기화되었습니다.");
}

/**
 * [최종 저장 핸들러 - 수정됨]
 * - 용접부 누락 시 저장 차단
 * - 동기화 로직 수정: RGB 저장 시에만 IR로 진행 단계 전파 (IR 저장 시에는 RGB 진행 단계 건드리지 않음)
 */
async function handleSaveClick(isSilent = false) {
    if (!currentJsonData) {
        if (!isSilent) alert("저장할 데이터가 없습니다.");
        return;
    }

    // [유효성 검사] 용접부 필수
    if (labelPoints.length === 0) {
        if (!isSilent) {
            alert("저장할 수 없습니다.\n\n[원인] 용접부 영역이 지정되지 않았습니다.\n용접부를 먼저 생성해주세요.");
        } else {
            console.warn(`[저장 실패] ${imageList[currentImageIndex].name} - 용접부 누락`);
        }
        return; 
    }

    const currentImgItem = imageList[currentImageIndex];
    const isIR = currentImgItem.type === "IR"; // 현재 이미지 타입 확인
    const fileHandle = currentImgItem.jsonFileHandle;

    try {
        syncUiDataToJson();
        updateWeldProgress(); 

        // [Step A] 현재 파일 쓰기
        let writable;
        if (fileHandle) {
            writable = await fileHandle.createWritable();
        } else {
            if (isSilent) {
                console.warn(`[자동저장 건너뜀] ${currentImgItem.name} 핸들 없음`);
                return; 
            }
            const opts = {
                types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
                suggestedName: currentImgItem.name.replace(/\.[^/.]+$/, "") + ".json",
            };
            const newHandle = await window.showSaveFilePicker(opts);
            writable = await newHandle.createWritable();
            currentImgItem.jsonFileHandle = newHandle;
        }

        const jsonString = JSON.stringify(currentJsonData, null, 2);
        await writable.write(jsonString);
        await writable.close();

        // [Step B] 짝꿍 파일 동기화 (진행 단계)
        if (fileHandle) { 
            const currentName = currentImgItem.name;
            let pairName = "";
            if (currentName.includes("_RGB_")) pairName = currentName.replace("_RGB_", "_IR_");
            else if (currentName.includes("_IR_")) pairName = currentName.replace("_IR_", "_RGB_");

            const pairItem = imageList.find(item => item.name === pairName);
            
            // 짝꿍 파일이 있고, JSON 핸들이 있을 때만 동기화 시도
            if (pairItem && pairItem.jsonFileHandle) {
                const pairFile = await pairItem.jsonFileHandle.getFile();
                const pairText = await pairFile.text();
                const pairJson = JSON.parse(pairText);
                if (!pairJson.annotations) pairJson.annotations = {};

                // [★핵심 수정] 진행 단계 동기화 방향 제어
                // 현재가 RGB일 때만 -> IR(pair)에게 내 진행 단계를 덮어씌움
                // 현재가 IR이면 -> RGB(pair)의 진행 단계를 건드리지 않음 (RGB가 Master)
                if (!isIR) {
                    pairJson.annotations.weld_progress = currentJsonData.annotations.weld_progress;
                    
                    const pairWritable = await pairItem.jsonFileHandle.createWritable();
                    await pairWritable.write(JSON.stringify(pairJson, null, 2));
                    await pairWritable.close();
                    
                    if (!isSilent) console.log("RGB 진행 단계가 IR에 동기화되었습니다.");
                }
            }
        }

        // [Step C] 상태 변경
        imageList[currentImageIndex].status = "saved";
        updateLocalStatus(currentImgItem.path, currentImgItem.name, "saved");
        renderVirtualThumbnails(); 

        isUserModified = false;

        if (!isSilent) {
            alert("저장 및 동기화가 완료되었습니다.");
            if (currentImageIndex < imageList.length - 1) {
                loadImageFromList(currentImageIndex + 1);
            } else {
                alert("마지막 이미지입니다.");
            }
        } else {
            console.log(`✅ [자동저장 완료] ${currentImgItem.name}`);
        }

    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("저장 실패:", err);
            if (!isSilent) alert("저장 중 오류가 발생했습니다: " + err.message);
        }
    }
}

// ============================================================
// [로컬 스토리지 관리 헬퍼 함수들 (폴더별 그룹화 버전)]
// 저장 구조: { "W001": { "file.jpg": "saved" }, "W032": ... }
// ============================================================
const STORAGE_KEY = "Spatter_Work_Log_Grouped"; 

/**
 * [1. 폴더명 추출 함수]
 * 파일 경로(path)에서 최상위 폴더명(W001 등)을 추출합니다.
 */
function getFolderName(path) {
  if (!path) return "Root";
  // 윈도우(\) 또는 맥/리눅스(/) 경로 구분자 모두 대응
  const normalizedPath = path.replace(/\\/g, "/"); 
  const parts = normalizedPath.split("/");
  
  // parts[0]이 폴더명입니다.
  return parts.length > 1 ? parts[0] : "Root";
}

/**
 * [2. 상태 저장/업데이트 함수]
 * 사용처: 저장(saved), 이미지 열기(visited)
 */
function updateLocalStatus(path, fileName, status) {
  try {
    const folderName = getFolderName(path);
    const storedData = localStorage.getItem(STORAGE_KEY);
    let data = storedData ? JSON.parse(storedData) : {};

    // 해당 폴더 키가 없으면 생성
    if (!data[folderName]) {
      data[folderName] = {};
    }

    // 상태 저장 (덮어쓰기)
    data[folderName][fileName] = status;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("로컬 스토리지 저장 실패:", e);
  }
}

/**
 * [3. 키 이름 변경 함수]
 * 사용처: 삭제(deleted) 시 파일명이 DEL_로 바뀔 때 사용
 * (기존 함수 renameLocalStatusKey를 이걸로 대체합니다)
 */
function renameLocalStatus(path, oldName, newName, newStatus) {
  try {
    const folderName = getFolderName(path);
    const storedData = localStorage.getItem(STORAGE_KEY);
    let data = storedData ? JSON.parse(storedData) : {};

    if (!data[folderName]) data[folderName] = {};

    // 1. 기존 이름(옛날 파일명)의 기록 삭제
    if (data[folderName][oldName]) {
      delete data[folderName][oldName];
    }

    // 2. 새 이름(DEL_ 파일명)으로 상태 저장
    data[folderName][newName] = newStatus;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("로컬 스토리지 키 변경 실패:", e);
  }
}

/**
 * [썸네일 검색 및 포커싱 함수]
 * - 기능: 입력된 텍스트가 포함된 첫 번째 파일을 찾아 스크롤을 이동시킴
 * - 특징: 가상 스크롤(Virtual Scroll) 환경에서도 정확한 위치로 점프
 */
function handleImageSearch(query) {
  // 1. 검색어 정리 (공백 제거, 소문자 변환)
  const searchText = query.trim().toLowerCase();
  
  if (!searchText || imageList.length === 0) return;

  // 2. 리스트에서 검색어가 포함된 첫 번째 이미지의 인덱스 찾기
  // (현재 선택된 이미지 다음부터 찾고 싶다면 로직을 조금 수정해야 하지만, 보통은 처음부터 찾습니다)
  const foundIndex = imageList.findIndex(item => 
    item.name.toLowerCase().includes(searchText)
  );

  if (foundIndex !== -1) {
    const thumbnailList = document.getElementById("thumbnailList");
    
    // 3. 해당 인덱스의 스크롤 위치 계산
    // (인덱스 * 항목 높이) - (화면 중앙 정렬 보정값)
    const targetTop = foundIndex * THUMB_HEIGHT;
    const centerOffset = thumbnailList.clientHeight / 2 - THUMB_HEIGHT / 2;
    
    // 4. 스크롤 이동
    thumbnailList.scrollTo({
      top: Math.max(0, targetTop - centerOffset),
      behavior: 'smooth' // 부드럽게 이동
    });

    // [선택 사항] 찾은 항목을 콘솔에 표시
    console.log(`검색됨: [${foundIndex}] ${imageList[foundIndex].name}`);
  }
}

// --- 키보드 이벤트 (Delete, Space, ESC, 화살표) ---
document.addEventListener("keydown", function (e) {
  if (imageList.length === 0) return;

  // 1. 이미지 이동 (화살표)
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    if (currentImageIndex > 0) loadImageFromList(currentImageIndex - 1);
    return;
  } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    if (currentImageIndex < imageList.length - 1)
      loadImageFromList(currentImageIndex + 1);
    return;
  }

  // 2. 입력 창에서는 단축키 무시
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  // 3. [Delete] 불티 삭제 (재정렬 로직 포함)
  if (e.key === "Delete") {
    if (selectedSpatterId !== null) {
      const index = spatterData.findIndex((s) => s.id === selectedSpatterId);
      
      if (index !== -1) {
        // (1) 데이터 삭제
        spatterData.splice(index, 1);
        selectedSpatterId = null;
        isUserModified = true;

        // (2) [★핵심] ID 재정렬
        spatterData.forEach((item, newIndex) => {
            item.id = newIndex + 1;
        });

        // (3) 화면 갱신
        renderLabelPoints();
        updateSpatterList();
        updateCaption();
        console.log("단축키로 불티 삭제 및 재정렬 완료");
      }
    }
    return;
  }

  // 4. [Spacebar] 불티 모드 토글
  if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      const spatterBtn = document.querySelector(".side-tab-btn.spatter");
      if (spatterBtn) spatterBtn.click();
      return;
  }

  // 5. [ESC] 작성 취소
  if (e.key === "Escape") {
    if (isAddingSpatter && tempSpatterPoints.length > 0) {
      e.preventDefault();
      tempSpatterPoints = [];
      renderLabelPoints();
      console.log("작성 취소됨");
    }
  }

  if (e.key === 'Escape') {
        const modal = document.getElementById('guideModal');
        if (modal && modal.style.display === 'flex') {
            closeGuideModal(); // [수정됨] 부드럽게 닫기 함수 호출
            
            // 모달이 닫힐 때는 다른 ESC 동작(작성 취소 등) 방지
            e.stopPropagation(); 
            e.preventDefault(); // (권장) 브라우저 기본 동작 방지 추가
            return; // [중요] 함수를 여기서 종료해야 아래 '작성 취소' 로직이 실행되지 않음
        }
    }
});

/**
 * [반응형 리사이즈 이벤트]
 * 브라우저 창 크기가 변경되면 0.1초 뒤에 이미지를 뷰어 크기에 다시 맞춥니다.
 */
window.addEventListener("resize", function () {
  // 이미지가 로드된 상태일 때만 실행
  if (!currentImage) return;

  clearTimeout(window.resizeTimer);

  window.resizeTimer = setTimeout(() => {
    fitImageToViewer(); // 뷰어 크기에 맞춰 배율 재계산
  }, 100);
});

// [DOM 초기화 및 이벤트 연결]
document.addEventListener("DOMContentLoaded", function () {
  const resetBtn = document.querySelector(".reset-btn"); // 버튼 선택자 수정 필요

  if (resetBtn) {
    // 기존 리스너 제거 (중복 방지) 후 새 함수 연결
    // 주의: cloneNode를 사용하면 기존 이벤트를 날리고 새로 달 수 있어 깔끔합니다.
    const newResetBtn = resetBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);

    newResetBtn.addEventListener("click", () => {
      resetCurrentImage(); // 위에서 만든 함수 실행
    });
  }

  // 1. 우측 패널 리사이징
  const resizer = document.getElementById("resizer");
  const rightPanel = document.querySelector(".right-panel");
  if (resizer && rightPanel) {
    let x = 0;
    let w = 0;
    const mouseDownHandler = function (e) {
      x = e.clientX;
      const rect = rightPanel.getBoundingClientRect();
      w = rect.width;
      resizer.classList.add("resizing");
      document.body.classList.add("resizing-active");
      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    };
    const mouseMoveHandler = function (e) {
      const dx = x - e.clientX;
      const newWidth = w + dx;
      if (newWidth > 430 && newWidth < 600) {
        rightPanel.style.width = `${newWidth}px`;
        if (window.resizeTimer) clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => {
          if (typeof fitImageToViewer === "function") fitImageToViewer();
        }, 50);
      }
    };
    const mouseUpHandler = function () {
      resizer.classList.remove("resizing");
      document.body.classList.remove("resizing-active");
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };
    resizer.addEventListener("mousedown", mouseDownHandler);
  }

  // 2. 불티 추가 모드 버튼
  const spatterBtn = document.querySelector(".side-tab-btn.spatter");
  if (spatterBtn) {
    spatterBtn.addEventListener("click", () => {
      if (!currentImage) {
        alert("이미지를 먼저 불러오세요.");
        return;
      }

      if (isAddingWeld) {
        // 용접부 모드 해제
        isAddingWeld = false;
        const weldBtn = document.querySelector(".side-tab-btn.weld");
        if (weldBtn) weldBtn.classList.remove("active-mode");
        const scrollContainer = document.querySelector(
          ".image-scroll-container"
        );
        if (scrollContainer)
          scrollContainer.removeEventListener("click", handleWeldAddClick);
      }

      isAddingSpatter = !isAddingSpatter;
      tempSpatterPoints = [];
      const scrollContainer = document.querySelector(".image-scroll-container");

      if (isAddingSpatter) {
        scrollContainer.classList.add("labeling-mode");
        spatterBtn.classList.add("active-mode");
        scrollContainer.addEventListener("click", handleSpatterAddClick);
      } else {
        scrollContainer.classList.remove("labeling-mode");
        spatterBtn.classList.remove("active-mode");
        scrollContainer.removeEventListener("click", handleSpatterAddClick);
        renderLabelPoints();
      }
    });
  }

  // 3. 용접부 추가 모드 버튼
  const weldBtn = document.querySelector(".side-tab-btn.weld");
  if (weldBtn) {
    weldBtn.addEventListener("click", () => {
      if (!currentImage) {
        alert("이미지를 먼저 불러오세요.");
        return;
      }

      if (labelPoints.length > 0) {
        alert("용접부 영역은 이미 존재합니다.");
        return;
      }

      if (isAddingSpatter) {
        // 불티 모드 해제
        isAddingSpatter = false;
        tempSpatterPoints = [];
        renderLabelPoints();
        const spatterBtn = document.querySelector(".side-tab-btn.spatter");
        if (spatterBtn) spatterBtn.classList.remove("active-mode");
        const scrollContainer = document.querySelector(
          ".image-scroll-container"
        );
        if (scrollContainer)
          scrollContainer.removeEventListener("click", handleSpatterAddClick);
      }

      isAddingWeld = !isAddingWeld;
      const scrollContainer = document.querySelector(".image-scroll-container");

      if (isAddingWeld) {
        scrollContainer.classList.add("labeling-mode");
        weldBtn.classList.add("active-mode");
        scrollContainer.addEventListener("click", handleWeldAddClick);
      } else {
        scrollContainer.classList.remove("labeling-mode");
        weldBtn.classList.remove("active-mode");
        scrollContainer.removeEventListener("click", handleWeldAddClick);
      }
    });
  }

  // 4. 홈 버튼
  const homeBtn = document.querySelector(".side-tab-btn.home");
  if (homeBtn) {
    homeBtn.addEventListener("click", function () {
      if (currentImage) fitImageToViewer();
    });
  }

  // 5. 전체 삭제 버튼 (수정됨)
  const deleteAllBtn = document.querySelector(".btn-delete-all");
  if (deleteAllBtn) {
    // 기존의 인라인 함수 "() => { ... }" 부분을 지우고 함수명만 넣습니다.
    deleteAllBtn.addEventListener("click", deleteAllSpatters);
  }

  // [수정] 불티 추가 모드일 때만 우클릭 메뉴 차단
  const imageViewer = document.getElementById("imageViewer");
  if (imageViewer) {
    imageViewer.addEventListener("contextmenu", function (e) {
      // 불티 추가 모드이거나 용접부 추가 모드일 때만 메뉴 차단
      if (
        isAddingSpatter ||
        (typeof isAddingWeld !== "undefined" && isAddingWeld)
      ) {
        e.preventDefault();
        return false;
      }
      // 일반 모드에서는 우클릭 메뉴 허용 (아무것도 하지 않음)
    });
  }
});

/**
 * [로컬 스토리지 기록 초기화 함수 - 버그 수정됨]
 * - 수정사항: 기록을 초기화하더라도, 이미 파일명이 'DEL_'로 변경된(삭제된) 항목은
 * 'deleted' 상태를 유지하여 UI 충돌(삭제됐는데 멀쩡해 보이는 현상) 방지
 */
function clearLocalStorageHistory() {
  const key = "Spatter_Work_Log_Grouped"; 
  
  const storedData = localStorage.getItem(key);
  if (!storedData) {
    alert("삭제할 작업 기록이 없습니다.");
    return;
  }

  const data = JSON.parse(storedData);
  
  // 1. 전체 기록 개수 계산
  let totalCount = 0;
  Object.values(data).forEach(folderData => {
      if (folderData) {
          totalCount += Object.keys(folderData).length;
      }
  });

  if (totalCount === 0) {
    alert("기록된 데이터가 없습니다.");
    localStorage.removeItem(key);
    return;
  }

  if (confirm(`현재 총 ${totalCount}개의 작업 기록(저장/삭제/확인)이 있습니다.\n모두 초기화하시겠습니까?\n(이미지와 JSON 파일은 삭제되지 않습니다)`)) {
    
    // 2. 스토리지 삭제 (장부는 찢어버림)
    localStorage.removeItem(key);

    // 3. 메모리 상의 상태 초기화 (단, 실제 삭제된 파일은 유지)
    imageList.forEach(item => {
        // [★핵심] 파일 이름이 이미 DEL_로 바뀌어 있다면, 기록을 지워도 삭제 상태여야 함
        if (item.name.startsWith("DEL_")) {
            item.status = "deleted";
        } else {
            // 저장(saved)이나 확인(visited)만 초기화
            item.status = null;
        }
    });

    // 4. 화면 갱신 (저장/확인 아이콘만 사라지고, 삭제 아이콘은 남음)
    renderVirtualThumbnails();

    alert("작업 기록(저장/확인)이 초기화되었습니다.\n(삭제된 항목 표시는 유지됩니다)");
  }
}

/**
 * 일괄 보정(모든 이미지에 대해 메타데이터 갱신)
 * options: { writeFiles: boolean, yieldEvery: number }
 *  - writeFiles: true이면 fileHandle이 있으면 덮어씀(또는 fileHandle 없으면 다운로드)
 *  - yieldEvery: n 건 처리마다 이벤트 루프에 제어권을 넘김 (기본 5)
 */
async function batchCorrectAll(options = {}) {
  const writeFiles = !!options.writeFiles;
  const yieldEvery = options.yieldEvery || 5;

  if (!imageList || imageList.length === 0) {
    alert("불러온 이미지가 없습니다.");
    return;
  }

  // 간단한 진행 표시 UI (없으면 생성)
  let progressEl = document.getElementById("batchProgressOverlay");
  if (!progressEl) {
    progressEl = document.createElement("div");
    progressEl.id = "batchProgressOverlay";
    progressEl.style = "position:fixed;left:10px;top:10px;padding:8px 12px;background:rgba(0,0,0,0.7);color:#fff;border-radius:6px;z-index:9999";
    document.body.appendChild(progressEl);
  }

  progressEl.textContent = `일괄 보정 시작... (0 / ${imageList.length})`;

  // 백업 권장
  console.log("[BatchCorrect] 시작 - 파일 백업을 권장합니다.");

  for (let idx = 0; idx < imageList.length; idx++) {
    const item = imageList[idx];
    progressEl.textContent = `일괄 보정 중... (${idx+1} / ${imageList.length}) - ${item.name}`;

    try {
      // 1) JSON 원문 로드 (file handle 우선)
      let jsonText = "";
      if (item.jsonFileHandle) {
        const f = await item.jsonFileHandle.getFile();
        jsonText = await f.text();
      } else if (item.jsonFile) {
        jsonText = await item.jsonFile.text();
      }

      // 만약 JSON이 없으면 건너뜀 (또는 빈 구조 생성)
      if (!jsonText) {
        console.warn(`[BatchCorrect] ${item.name} - 연결된 JSON 없음, 건너뜀`);
        continue;
      }

      const jsonData = JSON.parse(jsonText);

      // 2) 메모리상에서 기존 처리와 동일하게 셋업
      // NOTE: 기존 전역 변수를 사용하도록 되어있다면 안전하게 백업 후 세팅
      const prevCurrentJsonData = currentJsonData;
      const prevLabelPoints = labelPoints.slice();
      const prevSpatterData = spatterData.slice();

      currentJsonData = jsonData;
      labelPoints = [];
      spatterData = [];

      // 파싱: 용접부(weld_zone) -> labelPoints
      if (currentJsonData.annotations && Array.isArray(currentJsonData.annotations.weld_zone)) {
        currentJsonData.annotations.weld_zone.forEach(pt => {
          labelPoints.push({ normX: pt.x, normY: pt.y });
        });
      }

      // 파싱: spatter_annotations / annotations_auto -> spatterData
      const geomList = currentJsonData.spatter_annotations || [];
      const metaList = currentJsonData.annotations_auto || [];
      if (Array.isArray(geomList)) {
        geomList.forEach((itemG, gindex) => {
          if (itemG.points && Array.isArray(itemG.points)) {
            const meta = metaList[gindex] || {};
            spatterData.push({
              id: itemG.spatter_id || (gindex + 1),
              points: itemG.points,
              type: itemG.spatter_type,
              size: meta.spatter_size,
              distance: meta.spatter_distance,
              temp: meta.spatter_temp
            });
          }
        });
      }

      // 3) (필요시) 이미지 크기 필요: load image offscreen to get naturalWidth/height
      // 만약 recalculateWeldZone / recalculateSingleSpatter 내부에서 documentImage 의 naturalWidth를 사용한다면
      // 여기서는 offscreen Image 를 로드해서 전역적으로 참조 가능한 방식으로 세팅 필요.
      // 예: if (!item.dataURL) read dataURL first
      if (!item.dataURL) {
        // 비동기 파일 -> dataURL
        item.dataURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(item.file);
        });
      }

      // 임시로 문서의 이미지 요소에 로드시키고 naturalWidth/Height를 얻음.
      // (displayImage를 사용하면 화면이 바뀌므로, 여기서는 'offscreen' 처럼 보이게 숨겨 로드)
      let tempImg = document.getElementById("__batch_temp_img__");
      if (!tempImg) {
        tempImg = document.createElement("img");
        tempImg.id = "__batch_temp_img__";
        tempImg.style = "position:fixed;left:-9999px;top:-9999px;width:auto;height:auto;visibility:hidden";
        document.body.appendChild(tempImg);
      }
      await new Promise((resolve, reject) => {
        tempImg.onload = () => resolve();
        tempImg.onerror = () => {
          console.warn("[BatchCorrect] 이미지 로드 실패 (계산 일부 건너뜀): " + item.name);
          resolve(); // 계속 진행하도록
        };
        tempImg.src = item.dataURL;
      });

      // 이제 recalc 호출 (많은 기존 함수가 documentImage에 의존하면 임시로 documentImage에 덮어씌우거나
      // recalculateWeldZone/recalculateSingleSpatter를 DOM 독립적으로 수정 필요)
      // 여기서는 기존 함수가 documentImage를 사용한다 가정하고, 임시로 그 요소에 dataURL을 넣어 처리
      const origDocImg = document.getElementById("documentImage");
      let replacedDocImg = false;
      if (!origDocImg) {
        // displayImage를 사용하지 않고 DOM에 documentImage가 없다면 만들어서 처리
        const container = document.getElementById("imageContainer");
        if (container) {
          container.innerHTML = `<img id="documentImage" src="${item.dataURL}" style="display:none" />`;
          replacedDocImg = true;
        }
      } else {
        // 있으면 SRC만 바꿔서 계산에 사용 (화면 변경 최소)
        origDocImg.dataset._origSrc = origDocImg.src;
        origDocImg.src = item.dataURL;
        // 잠시 로딩이 필요할 수 있음 - 하지만 이미 tempImg 로 로드했으므로 빠름
      }

      // 4) 재계산: 용접부 / 불티
      try {
        // 용접부 재계산 (이 함수는 currentJsonData, labelPoints를 사용)
        recalculateWeldZone();

        // 모든 불티 재계산
        for (let s = 0; s < spatterData.length; s++) {
          recalculateSingleSpatter(s);
        }

        // progress/caption update (메모리상 갱신)
        updateWeldProgress();
        updateCaption();
      } catch (e) {
        console.error("[BatchCorrect] 재계산 중 오류:", e);
      }

      // 5) 변경된 currentJsonData를 파일에 기록
      if (writeFiles && (item.jsonFileHandle || item.jsonFile)) {
        // 파일 핸들로 덮어쓰기 가능한 경우
        if (item.jsonFileHandle) {
          try {
            const writable = await item.jsonFileHandle.createWritable();
            await writable.write(JSON.stringify(currentJsonData, null, 2));
            await writable.close();
            console.log(`[BatchCorrect] ${item.name} JSON 덮어쓰기 완료`);
          } catch (err) {
            console.warn(`[BatchCorrect] ${item.name} 파일 쓰기 실패`, err);
            // fallback: 다운로드 제공
            const blob = new Blob([JSON.stringify(currentJsonData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = item.name.replace(/\.[^.]+$/, ".json");
            a.click();
            URL.revokeObjectURL(url);
          }
        } else {
          // 파일 핸들 없으면 다운로드로 제공
          const blob = new Blob([JSON.stringify(currentJsonData, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = item.name.replace(/\.[^.]+$/, ".json");
          a.click();
          URL.revokeObjectURL(url);
        }
      }

      // 6) 로컬 상태 갱신(visited/saved 등) 및 UI 반영(썸네일 등)
      imageList[idx].status = "saved";
      updateLocalStatus(imageList[idx].path, imageList[idx].name, "saved");
      // (필요시) renderVirtualThumbnails(); // 주석 해제하면 중간중간 UI 갱신

      // 7) 복원
      currentJsonData = prevCurrentJsonData;
      labelPoints = prevLabelPoints;
      spatterData = prevSpatterData;

      // restore documentImage src
      if (origDocImg) {
        if (origDocImg.dataset && origDocImg.dataset._origSrc) {
          origDocImg.src = origDocImg.dataset._origSrc;
          delete origDocImg.dataset._origSrc;
        }
      } else if (replacedDocImg) {
        const container = document.getElementById("imageContainer");
        if (container) container.innerHTML = ""; // 제거
      }
    } catch (err) {
      console.error("[BatchCorrect] 처리 실패:", item.name, err);
    }

    // 주기적으로 이벤트 루프에 제어권 반환 (브라우저 프리징 방지)
    if ((idx + 1) % yieldEvery === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  } // end for

  progressEl.textContent = `일괄 보정 완료 (${imageList.length}건)`;
  setTimeout(() => {
    if (progressEl && progressEl.parentNode) progressEl.parentNode.removeChild(progressEl);
  }, 1500);

  // 전체 UI 갱신: 현재 인덱스 이미지 재로딩
  loadImageFromList(currentImageIndex);
  alert("일괄 보정이 완료되었습니다.");
}

/**
 * [일괄 보정 기능 - 최종 수정]
 * - 데이터는 실제 파일에 저장되지만,
 * - 'saved' 상태를 UI(썸네일)나 로컬 스토리지(History)에 남기지 않음 (Silent Update)
 */
async function runBatchCorrection() {
  if (!imageList || imageList.length === 0) {
    alert("불러온 이미지가 없습니다.");
    return;
  }

  if (!confirm("모든 이미지에 대해 일괄 보정을 시작하시겠습니까?\n\n주의: 이 작업은 모든 JSON 데이터를 현재 로직(용접부 크기, 온도, 화재위험도 등) 기준으로 덮어씁니다.")) {
    return;
  }

  // 작업 진행 표시용 UI 생성
  const overlay = document.createElement('div');
  overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); color:white; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999; font-size:18px;";
  overlay.innerHTML = `<div>데이터 일괄 보정 중...</div><div id="batchProgress" style="margin-top:10px; font-weight:bold;">0 / ${imageList.length}</div>`;
  document.body.appendChild(overlay);

  const progressText = document.getElementById('batchProgress');
  
  // 현재 보고 있던 이미지 인덱스 저장 (작업 후 복귀용)
  const originalIndex = currentImageIndex;

  try {
    for (let i = 0; i < imageList.length; i++) {
      // 1. 진행률 업데이트
      progressText.textContent = `${i + 1} / ${imageList.length}`;
      
      // 2. 강제로 해당 인덱스로 이동
      currentImageIndex = i;
      const item = imageList[i];
      
      // JSON 로드
      let jsonText = "";
      if (item.jsonFileHandle) {
        const file = await item.jsonFileHandle.getFile();
        jsonText = await file.text();
      } else if (item.jsonFile) {
        jsonText = await item.jsonFile.text();
      }

      if (!jsonText) continue;

      // 전역 변수 초기화
      currentJsonData = JSON.parse(jsonText);
      labelPoints = [];
      spatterData = [];
      
      // 3. JSON 파싱
      if (currentJsonData.annotations && Array.isArray(currentJsonData.annotations.weld_zone)) {
        currentJsonData.annotations.weld_zone.forEach((pt) => {
          labelPoints.push({ normX: pt.x, normY: pt.y });
        });
      }
      const geomList = currentJsonData.spatter_annotations || [];
      const metaList = currentJsonData.annotations_auto || [];
      if (Array.isArray(geomList)) {
        geomList.forEach((spat, idx) => {
           const meta = metaList[idx] || {};
           spatterData.push({
             id: spat.spatter_id,
             points: spat.points,
             type: spat.spatter_type,
             size: meta.spatter_size || 0,
             distance: meta.spatter_distance || 0,
             temp: meta.spatter_temp || 0
           });
        });
      }

      // 4. 이미지 DOM 로드
      const img = document.getElementById("documentImage");
      let src = item.dataURL;
      if (!src) {
         const fileData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(item.file);
         });
         src = fileData;
      }
      
      img.src = src;
      await new Promise(resolve => {
          if (img.complete) resolve();
          else img.onload = resolve;
      });

      // 5. 재계산 및 업데이트
      recalculateWeldZone();
      for (let s = 0; s < spatterData.length; s++) {
        recalculateSingleSpatter(s);
      }
      updateWeldProgress();

      isUserModified = true; 
      updateCaption();

      // 6. 데이터 동기화 및 파일 저장
      syncUiDataToJson();

      if (item.jsonFileHandle) {
        const writable = await item.jsonFileHandle.createWritable();
        await writable.write(JSON.stringify(currentJsonData, null, 2));
        await writable.close();
      }
      
      isUserModified = false;
      await new Promise(r => setTimeout(r, 10));
    }

    alert("일괄 보정이 완료되었습니다.");

  } catch (err) {
    console.error(err);
    alert("일괄 보정 중 오류가 발생했습니다: " + err.message);
  } finally {
    document.body.removeChild(overlay);
    isUserModified = false;

    // 원래 이미지로 복귀 및 UI 갱신
    await loadImageFromList(originalIndex);
    
    const img = document.getElementById("documentImage");
    if (img) {
        const refreshUI = () => {
            updateSpatterList(); 
            updateCaption();     
        };

        if (img.complete && img.naturalWidth > 0) {
            refreshUI();
        } else {
            img.onload = () => {
                setTimeout(refreshUI, 0); 
            };
        }
    }
    
    // [중요] 썸네일 상태도 변경하지 않았으므로 그냥 다시 그리기만 하면 됨
    renderVirtualThumbnails();
  }
}

let isHistoryDisabled = false;

/**
 * [기록 방지 토글 함수 - 신규]
 * 버튼 클릭 시 로컬 스토리지 기록 여부를 켜고 끕니다.
 */
function toggleHistoryRecording() {
  const btn = document.getElementById("btnToggleHistory");
  isHistoryDisabled = !isHistoryDisabled; // 상태 반전

  if (isHistoryDisabled) {
    // 기록 방지 모드 ON (빨간색, 꺼짐 아이콘)
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-toggle-off"></i> 기록 중지';
      btn.classList.add("history-off");
      btn.title = "현재 작업 내용이 로컬 스토리지에 기록되지 않습니다.";
    }
    console.log("🚫 작업 기록(History) 저장이 중지되었습니다.");
  } else {
    // 기록 모드 ON (기본, 켜짐 아이콘)
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-toggle-on"></i> 기록 켜짐';
      btn.classList.remove("history-off");
      btn.title = "작업 내용이 로컬 스토리지에 정상적으로 기록됩니다.";
    }
    console.log("✅ 작업 기록(History) 저장이 활성화되었습니다.");
  }
}

/* =========================================
   [가이드 모달 제어 함수 - 애니메이션 적용]
   ========================================= */

/**
 * 모달 열기/닫기 토글 (버튼 클릭 시 사용)
 */
function toggleGuideModal() {
    const modal = document.getElementById('guideModal');
    if (!modal) return;

    // 현재 열려있으면(flex) -> 닫기 함수 호출
    if (modal.style.display === 'flex') {
        closeGuideModal();
    } else {
        // 닫혀있으면 -> 바로 열기 (CSS fadeIn 애니메이션 자동 실행됨)
        modal.style.display = 'flex';
    }
}

/**
 * 모달 닫기 (애니메이션 처리)
 */
function closeGuideModal() {
    const modal = document.getElementById('guideModal');
    const content = modal.querySelector('.modal-content');
    
    if (!modal || modal.style.display === 'none') return;

    // 1. 닫기 애니메이션 클래스 추가
    content.classList.add('closing');

    // 2. 애니메이션 시간(0.2s)만큼 기다린 후 실제 숨김 처리
    setTimeout(() => {
        modal.style.display = 'none';
        content.classList.remove('closing'); // 다음 열기를 위해 클래스 제거
    }, 200); // CSS animation-duration과 동일하게 맞춤
}

// 1. 모달 바깥 영역(검은 배경) 클릭 시 닫기
document.addEventListener('click', function(e) {
    const modal = document.getElementById('guideModal');
    if (modal && e.target === modal) {
        closeGuideModal(); // 통합된 닫기 함수 호출
    }
});

// 2. ESC 키 및 단축키 처리 (기존 리스너 내부 수정 필요)
// document.addEventListener("keydown", ...) 내부의 ESC 처리 부분을 아래와 같이 변경하세요.

/* [기존 ESC 처리 코드 수정 가이드]
Scan.js의 keydown 리스너 안에서 "if (e.key === 'Escape')" 부분을 찾아
모달 닫는 로직을 closeGuideModal() 호출로 바꾸면 됩니다.

예시:
if (e.key === "Escape") {
    e.preventDefault();

    // (1) 도움말 모달이 열려있으면 부드럽게 닫기
    const modal = document.getElementById('guideModal');
    if (modal && modal.style.display === 'flex') {
        closeGuideModal(); // [수정됨]
        return;
    }
    
    // ... (나머지 작성 취소, 선택 해제 로직 그대로 유지) ...
}
*/