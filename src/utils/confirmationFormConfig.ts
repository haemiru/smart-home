// 중개대상물 확인·설명서 양식 설정
// 공인중개사법 시행규칙 별지 제20호, 제20호의2, 제20호의3 서식 기반
// 양식 개정 시 이 파일만 수정하면 UI 자동 반영

export type ConfirmationFormType = 'residential' | 'commercial' | 'land'

export type FieldInputType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number'

export type ConfirmationField = {
  key: string
  label: string
  inputType: FieldInputType
  options?: string[]
  placeholder?: string
  required?: boolean
  fullWidth?: boolean
}

export type ConfirmationSection = {
  key: string
  title: string
  fields: ConfirmationField[]
}

export type ConfirmationFormDef = {
  type: ConfirmationFormType
  label: string
  sections: ConfirmationSection[]
}

// ── 계약서 template_type → 확인설명서 양식 매핑 ──

export function getConfirmationFormType(templateType: string): ConfirmationFormType {
  if (templateType.startsWith('land')) return 'land'
  if (
    templateType.startsWith('commercial') ||
    templateType.startsWith('building') ||
    templateType.startsWith('factory') ||
    templateType.startsWith('knowledge_center')
  ) return 'commercial'
  return 'residential'
}

// ── 공통 필드 ──

const conditionOptions = ['양호', '보통', '불량']

const propertyDescSection: ConfirmationSection = {
  key: 'property_desc',
  title: '대상물건의 표시',
  fields: [
    { key: 'address', label: '소재지', inputType: 'text', required: true },
    { key: 'land_area', label: '토지면적 (㎡)', inputType: 'number' },
    { key: 'building_area', label: '건물면적 (㎡)', inputType: 'number' },
    { key: 'exclusive_area', label: '전용면적 (㎡)', inputType: 'number' },
    { key: 'building_use', label: '건물용도', inputType: 'text' },
    { key: 'structure', label: '구조', inputType: 'text', placeholder: '예: 철근콘크리트조' },
    { key: 'floor_info', label: '해당층/총층', inputType: 'text', placeholder: '예: 5층/15층' },
    { key: 'direction', label: '방향', inputType: 'text' },
    { key: 'built_year', label: '건축연도', inputType: 'text' },
  ],
}

const rightsSection: ConfirmationSection = {
  key: 'rights',
  title: '권리관계',
  fields: [
    { key: 'ownership_type', label: '소유권 구분', inputType: 'select', options: ['단독소유', '공동소유'], required: true },
    { key: 'owner_name', label: '소유자', inputType: 'text' },
    { key: 'registered_rights', label: '등기부 기재사항 (갑구)', inputType: 'textarea', placeholder: '소유권 이전, 가압류, 가처분 등', fullWidth: true },
    { key: 'encumbrances', label: '등기부 기재사항 (을구)', inputType: 'textarea', placeholder: '저당권, 전세권, 지상권 등', fullWidth: true },
    { key: 'unregistered_rights', label: '등기부 외 권리사항', inputType: 'textarea', placeholder: '미등기 임차권 등', fullWidth: true },
    { key: 'tenant_status', label: '임차 여부', inputType: 'radio', options: ['있음', '없음'] },
    { key: 'tenant_detail', label: '임차 상세', inputType: 'textarea', placeholder: '임차인, 보증금, 계약기간 등', fullWidth: true },
  ],
}

const landUseSection: ConfirmationSection = {
  key: 'land_use',
  title: '토지이용계획 · 공법상 이용제한',
  fields: [
    { key: 'use_zone', label: '용도지역', inputType: 'text', placeholder: '예: 제2종일반주거지역' },
    { key: 'use_district', label: '용도지구', inputType: 'text' },
    { key: 'use_area', label: '용도구역', inputType: 'text' },
    { key: 'land_use_restriction', label: '이용제한 사항', inputType: 'textarea', placeholder: '건폐율, 용적률, 높이제한 등', fullWidth: true },
    { key: 'land_plan_note', label: '토지이용계획확인서 비고', inputType: 'textarea', fullWidth: true },
  ],
}

const environmentSection: ConfirmationSection = {
  key: 'environment',
  title: '환경조건',
  fields: [
    { key: 'sunlight', label: '일조량', inputType: 'select', options: conditionOptions },
    { key: 'noise', label: '소음', inputType: 'select', options: conditionOptions },
    { key: 'vibration', label: '진동', inputType: 'select', options: conditionOptions },
    { key: 'odor', label: '악취', inputType: 'select', options: conditionOptions },
    { key: 'environment_note', label: '환경 비고', inputType: 'textarea', fullWidth: true },
  ],
}

const costSection: ConfirmationSection = {
  key: 'acquisition_cost',
  title: '취득 시 부담금',
  fields: [
    { key: 'acquisition_tax', label: '취득세 (예상)', inputType: 'text' },
    { key: 'registration_tax', label: '등록면허세 (예상)', inputType: 'text' },
    { key: 'education_tax', label: '지방교육세 (예상)', inputType: 'text' },
    { key: 'cost_note', label: '기타 부담금', inputType: 'textarea', fullWidth: true },
  ],
}

const brokerageSection: ConfirmationSection = {
  key: 'brokerage',
  title: '중개보수',
  fields: [
    { key: 'brokerage_rate', label: '요율', inputType: 'text', placeholder: '예: 0.4%' },
    { key: 'brokerage_fee', label: '중개보수 (원)', inputType: 'number' },
    { key: 'brokerage_vat', label: '부가세', inputType: 'text' },
    { key: 'brokerage_payment', label: '지급시기', inputType: 'text', placeholder: '예: 잔금 지급 시' },
    { key: 'actual_expense', label: '실비', inputType: 'text' },
  ],
}

// ── 주거용 (별지 제20호서식) ──

const residentialForm: ConfirmationFormDef = {
  type: 'residential',
  label: '주거용 건축물 확인·설명서 (별지 제20호)',
  sections: [
    propertyDescSection,
    rightsSection,
    landUseSection,
    {
      key: 'facilities',
      title: '내부·외부 시설 상태',
      fields: [
        { key: 'water_supply', label: '수도', inputType: 'select', options: conditionOptions },
        { key: 'electricity', label: '전기', inputType: 'select', options: conditionOptions },
        { key: 'gas', label: '가스', inputType: 'select', options: ['도시가스', 'LPG', '없음'] },
        { key: 'fire_safety', label: '소방', inputType: 'select', options: conditionOptions },
        { key: 'heating_type', label: '난방 종류', inputType: 'select', options: ['개별난방', '중앙난방', '지역난방'] },
        { key: 'heating_fuel', label: '난방 연료', inputType: 'select', options: ['도시가스', '기름', '전기', '기타'] },
        { key: 'hot_water', label: '온수', inputType: 'select', options: conditionOptions },
        { key: 'elevator', label: '승강기', inputType: 'radio', options: ['있음', '없음'] },
        { key: 'drainage', label: '배수', inputType: 'select', options: conditionOptions },
        { key: 'parking', label: '주차', inputType: 'text', placeholder: '주차 가능 대수 또는 형태' },
        { key: 'facilities_note', label: '시설 비고', inputType: 'textarea', fullWidth: true },
      ],
    },
    {
      key: 'management',
      title: '관리에 관한 사항',
      fields: [
        { key: 'mgmt_company', label: '관리주체', inputType: 'text', placeholder: '관리사무소명 또는 자체관리' },
        { key: 'mgmt_fee', label: '월 관리비 (원)', inputType: 'number' },
        { key: 'mgmt_fee_includes', label: '관리비 포함 항목', inputType: 'text', placeholder: '예: 수도, 전기, 인터넷' },
        { key: 'prepaid_mgmt', label: '선수관리비 (원)', inputType: 'number' },
        { key: 'mgmt_note', label: '관리 비고', inputType: 'textarea', fullWidth: true },
      ],
    },
    {
      key: 'interior',
      title: '실내 시설물 상태',
      fields: [
        { key: 'wall_condition', label: '벽면/도배', inputType: 'select', options: conditionOptions },
        { key: 'floor_condition', label: '바닥', inputType: 'select', options: conditionOptions },
        { key: 'window_condition', label: '창호', inputType: 'select', options: conditionOptions },
        { key: 'rooms', label: '방 수', inputType: 'number' },
        { key: 'bathrooms', label: '욕실 수', inputType: 'number' },
        { key: 'move_in_date', label: '입주 가능일', inputType: 'text', placeholder: '즉시 또는 날짜' },
        { key: 'interior_note', label: '실내 비고', inputType: 'textarea', fullWidth: true },
      ],
    },
    environmentSection,
    costSection,
    brokerageSection,
  ],
}

// ── 비주거용 (별지 제20호의2서식) ──

const commercialForm: ConfirmationFormDef = {
  type: 'commercial',
  label: '비주거용 건축물 확인·설명서 (별지 제20호의2)',
  sections: [
    propertyDescSection,
    rightsSection,
    landUseSection,
    {
      key: 'building_status',
      title: '건축물 현황',
      fields: [
        { key: 'building_coverage', label: '건폐율 (%)', inputType: 'number' },
        { key: 'floor_area_ratio', label: '용적률 (%)', inputType: 'number' },
        { key: 'building_approval', label: '사용승인일', inputType: 'text' },
        { key: 'illegal_building', label: '위반건축물 여부', inputType: 'radio', options: ['해당없음', '해당있음'] },
        { key: 'illegal_detail', label: '위반 내용', inputType: 'textarea', fullWidth: true },
      ],
    },
    {
      key: 'facilities',
      title: '내부·외부 시설 상태',
      fields: [
        { key: 'water_supply', label: '수도', inputType: 'select', options: conditionOptions },
        { key: 'electricity', label: '전기', inputType: 'select', options: conditionOptions },
        { key: 'gas', label: '가스', inputType: 'select', options: ['도시가스', 'LPG', '없음'] },
        { key: 'fire_safety', label: '소방', inputType: 'select', options: conditionOptions },
        { key: 'heating_cooling', label: '냉난방', inputType: 'text', placeholder: '냉난방 방식' },
        { key: 'elevator', label: '승강기', inputType: 'radio', options: ['있음', '없음'] },
        { key: 'parking_count', label: '주차 가능 대수', inputType: 'number' },
        { key: 'loading_dock', label: '하역시설', inputType: 'radio', options: ['있음', '없음'] },
        { key: 'facilities_note', label: '시설 비고', inputType: 'textarea', fullWidth: true },
      ],
    },
    {
      key: 'business',
      title: '영업에 관한 사항',
      fields: [
        { key: 'business_restriction', label: '영업 제한 여부', inputType: 'radio', options: ['제한없음', '제한있음'] },
        { key: 'business_restriction_detail', label: '영업 제한 내용', inputType: 'textarea', fullWidth: true },
        { key: 'permit_required', label: '허가/신고 필요 여부', inputType: 'radio', options: ['불필요', '필요'] },
        { key: 'permit_detail', label: '허가/신고 상세', inputType: 'textarea', fullWidth: true },
      ],
    },
    environmentSection,
    costSection,
    brokerageSection,
  ],
}

// ── 토지 (별지 제20호의3서식) ──

const landForm: ConfirmationFormDef = {
  type: 'land',
  label: '토지 확인·설명서 (별지 제20호의3)',
  sections: [
    {
      key: 'property_desc',
      title: '대상물건의 표시',
      fields: [
        { key: 'address', label: '소재지', inputType: 'text', required: true },
        { key: 'lot_number', label: '지번', inputType: 'text' },
        { key: 'land_category', label: '지목', inputType: 'text', placeholder: '예: 대, 전, 답, 임야' },
        { key: 'land_area', label: '면적 (㎡)', inputType: 'number' },
        { key: 'share', label: '지분', inputType: 'text', placeholder: '예: 전부 또는 1/2' },
      ],
    },
    rightsSection,
    {
      key: 'land_use',
      title: '토지이용계획 · 공법상 이용제한',
      fields: [
        { key: 'use_zone', label: '용도지역', inputType: 'text', placeholder: '예: 제2종일반주거지역', required: true },
        { key: 'use_district', label: '용도지구', inputType: 'text' },
        { key: 'use_area', label: '용도구역', inputType: 'text' },
        { key: 'building_coverage_limit', label: '건폐율 제한 (%)', inputType: 'number' },
        { key: 'floor_area_ratio_limit', label: '용적률 제한 (%)', inputType: 'number' },
        { key: 'height_limit', label: '높이 제한', inputType: 'text' },
        { key: 'land_use_restriction', label: '이용제한 사항', inputType: 'textarea', fullWidth: true },
        { key: 'land_plan_note', label: '비고', inputType: 'textarea', fullWidth: true },
      ],
    },
    {
      key: 'road',
      title: '도로 관계',
      fields: [
        { key: 'road_contact', label: '접면도로', inputType: 'radio', options: ['접함', '미접함'] },
        { key: 'road_type', label: '도로 종류', inputType: 'text', placeholder: '예: 포장도로, 비포장도로' },
        { key: 'road_width', label: '도로 폭 (m)', inputType: 'number' },
        { key: 'road_access', label: '진입로', inputType: 'text' },
        { key: 'road_note', label: '도로 비고', inputType: 'textarea', fullWidth: true },
      ],
    },
    {
      key: 'land_condition',
      title: '토지 상태',
      fields: [
        { key: 'topography', label: '지세', inputType: 'select', options: ['평지', '완경사', '급경사'] },
        { key: 'shape', label: '형상', inputType: 'select', options: ['정방형', '장방형', '부정형', '삼각형', '자루형'] },
        { key: 'elevation', label: '고저', inputType: 'select', options: ['도로면과 동일', '높음', '낮음'] },
        { key: 'land_current_use', label: '현재 이용 상황', inputType: 'text', placeholder: '예: 나대지, 경작중, 건물부지' },
        { key: 'land_condition_note', label: '토지 상태 비고', inputType: 'textarea', fullWidth: true },
      ],
    },
    environmentSection,
    costSection,
    brokerageSection,
  ],
}

// ── Export ──

export const confirmationForms: Record<ConfirmationFormType, ConfirmationFormDef> = {
  residential: residentialForm,
  commercial: commercialForm,
  land: landForm,
}
